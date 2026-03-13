import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMaterialThemeManifests, buildVscodeIconsManifest, buildSetiManifest, ALL_THEME_PACKS } from '../src/icon-engine/manifest-builder';
import type { Manifest } from 'material-icon-theme';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const materialIconsSourceDir = resolve(projectRoot, 'node_modules/material-icon-theme/icons');
const iconsTargetDir = resolve(projectRoot, 'public/icons');
const manifestsTargetDir = resolve(projectRoot, 'public/manifests');
const generatedPacksFile = resolve(projectRoot, 'src/generated/theme-packs.ts');
const legacyGeneratedManifestFile = resolve(projectRoot, 'src/generated/material-theme.ts');
const legacyGeneratedPacksFile = resolve(projectRoot, 'src/generated/material-theme-packs.ts');

const vscodeIconsJsonPath = resolve(projectRoot, 'node_modules/vscode-icons-js/data/generated/icons.json');
const iconifyJsonPath = resolve(projectRoot, 'node_modules/@iconify-json/vscode-icons/icons.json');
const setiDefinitionsPath = resolve(projectRoot, 'node_modules/@peoplesgrocers/seti-ui-file-icons/lib/definitions.json');
const setiIconsPath = resolve(projectRoot, 'node_modules/@peoplesgrocers/seti-ui-file-icons/lib/icons.json');

interface IconifyData {
  prefix: string;
  icons: Record<string, { body: string; width?: number; height?: number }>;
  aliases?: Record<string, { parent: string }>;
  width: number;
  height: number;
}

function collectReferencedIconIds(manifest: Manifest): Set<string> {
  const referenced = new Set<string>();
  const addMap = (map: Record<string, string> | undefined) => {
    if (!map) {
      return;
    }

    for (const iconId of Object.values(map)) {
      if (iconId) {
        referenced.add(iconId);
      }
    }
  };

  [
    manifest.fileNames,
    manifest.fileExtensions,
    manifest.languageIds,
    manifest.folderNames,
    manifest.folderNamesExpanded,
    manifest.rootFolderNames,
    manifest.rootFolderNamesExpanded,
    manifest.light?.fileNames,
    manifest.light?.fileExtensions,
    manifest.light?.languageIds,
    manifest.light?.folderNames,
    manifest.light?.folderNamesExpanded,
    manifest.light?.rootFolderNames,
    manifest.light?.rootFolderNamesExpanded,
  ].forEach(addMap);

  for (const iconId of [
    manifest.file,
    manifest.folder,
    manifest.folderExpanded,
    manifest.rootFolder,
    manifest.rootFolderExpanded,
    manifest.light?.file,
    manifest.light?.folder,
    manifest.light?.folderExpanded,
    manifest.light?.rootFolder,
    manifest.light?.rootFolderExpanded,
  ]) {
    if (iconId) {
      referenced.add(iconId);
    }
  }

  return referenced;
}

function findUnreferencedIconIds(manifest: Manifest): string[] {
  const referenced = collectReferencedIconIds(manifest);

  return Object.keys(manifest.iconDefinitions ?? {}).filter(
    (iconId) => !referenced.has(iconId),
  );
}

function assertAllIconsReachable(manifests: Record<string, Manifest>) {
  const failures = Object.entries(manifests)
    .map(([pack, manifest]) => ({
      pack,
      unused: findUnreferencedIconIds(manifest),
    }))
    .filter(({ unused }) => unused.length > 0);

  if (failures.length === 0) {
    return;
  }

  const summary = failures
    .map(
      ({ pack, unused }) =>
        `${pack}: ${unused.length} unused (${unused.slice(0, 10).join(', ')})`,
    )
    .join('\n');

  throw new Error(`Generated manifests still contain unreachable icons.\n${summary}`);
}

function buildSvg(body: string, width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">${body}</svg>`;
}

async function extractVscodeIconsSvgs(svgFilenames: string[]): Promise<void> {
  const iconify: IconifyData = JSON.parse(readFileSync(iconifyJsonPath, 'utf-8'));
  const defaultWidth = iconify.width;
  const defaultHeight = iconify.height;

  const writes: Promise<void>[] = [];

  for (const filename of svgFilenames) {
    const iconifyId = filename.replace('.svg', '').replace(/_/g, '-');
    let iconData = iconify.icons[iconifyId];

    if (!iconData && iconify.aliases?.[iconifyId]) {
      const parentId = iconify.aliases[iconifyId].parent;
      iconData = iconify.icons[parentId];
    }

    if (!iconData) {
      continue;
    }

    const width = iconData.width ?? defaultWidth;
    const height = iconData.height ?? defaultHeight;
    const svg = buildSvg(iconData.body, width, height);
    writes.push(writeFile(resolve(iconsTargetDir, filename), svg));
  }

  await Promise.all(writes);
}

async function main() {
  const { manifests: materialManifests } = buildMaterialThemeManifests();
  const { manifest: vscodeIconsManifest, svgFilenames } = buildVscodeIconsManifest(vscodeIconsJsonPath);
  const { manifest: setiManifest, svgFiles: setiSvgFiles } = buildSetiManifest(setiDefinitionsPath, setiIconsPath);
  const allManifests: Record<string, Manifest> = {
    ...materialManifests,
    'vscode-icons': vscodeIconsManifest,
    seti: setiManifest,
  };

  assertAllIconsReachable(allManifests);

  await rm(iconsTargetDir, { force: true, recursive: true });
  await mkdir(iconsTargetDir, { recursive: true });
  await cp(materialIconsSourceDir, iconsTargetDir, { recursive: true });
  await extractVscodeIconsSvgs(svgFilenames);
  await Promise.all(
    [...setiSvgFiles.entries()].map(([filename, svg]) =>
      writeFile(resolve(iconsTargetDir, filename), svg),
    ),
  );

  await rm(manifestsTargetDir, { force: true, recursive: true });
  await mkdir(manifestsTargetDir, { recursive: true });

  await Promise.all(
    Object.entries(allManifests).map(([pack, manifest]) =>
      writeFile(resolve(manifestsTargetDir, `${pack}.json`), JSON.stringify(manifest)),
    ),
  );

  const source = `/* This file is generated by scripts/copy-icons.ts. */
import type { ThemePackId } from '../icon-engine/types';

export const allThemePacks = ${JSON.stringify(ALL_THEME_PACKS, null, 2)} as const satisfies readonly ThemePackId[];
`;

  await mkdir(resolve(projectRoot, 'src/generated'), { recursive: true });
  await writeFile(generatedPacksFile, source);
  await rm(legacyGeneratedManifestFile, { force: true });
  await rm(legacyGeneratedPacksFile, { force: true });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
