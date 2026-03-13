import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Manifest } from 'material-icon-theme';

import { ALL_THEME_PACKS, SUPPORTED_MATERIAL_PACKS } from '../src/icon-engine/manifest-builder';

type ThemeFamily = 'material' | 'vscode' | 'seti';

interface IconRef {
  iconId: string;
  iconPath: string;
}

interface FamilyEntry {
  material: Map<string, IconRef>;
  vscode: Map<string, IconRef>;
  seti: Map<string, IconRef>;
}

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const manifestsDir = resolve(projectRoot, 'public/manifests');
const readmePath = resolve(projectRoot, 'README.md');

const SETI_COLOR_SUFFIXES = new Set([
  'blue',
  'green',
  'orange',
  'pink',
  'purple',
  'red',
  'white',
  'yellow',
  'grey-light',
  'grey',
  'ignore',
]);

function loadManifest(pack: string): Manifest {
  return JSON.parse(
    readFileSync(resolve(manifestsDir, `${pack}.json`), 'utf8'),
  ) as Manifest;
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

function getIconDefinition(
  manifest: Manifest,
  iconId: string,
): { iconPath: string } | undefined {
  return (
    manifest.iconDefinitions?.[iconId] ??
    manifest.light?.iconDefinitions?.[iconId]
  );
}

function normalizeMaterialConcept(iconId: string): string {
  return iconId
    .replace(/\.clone$/, '')
    .replace(/_light$/, '-light')
    .replace(/_/g, '-')
    .toLowerCase();
}

function normalizeVscodeConcept(iconId: string): string {
  if (iconId === '_file') {
    return 'file';
  }

  if (iconId === '_folder') {
    return 'folder';
  }

  if (iconId === '_folder_open') {
    return 'folder-open';
  }

  if (iconId === '_root_folder') {
    return 'root-folder';
  }

  if (iconId === '_root_folder_open') {
    return 'root-folder-open';
  }

  if (iconId.startsWith('_fd_')) {
    return `folder-${iconId.slice(4)}`.replace(/_/g, '-').toLowerCase();
  }

  if (iconId.startsWith('_f_')) {
    return iconId.slice(3).replace(/_/g, '-').toLowerCase();
  }

  return iconId.replace(/^_+/, '').replace(/_/g, '-').toLowerCase();
}

function normalizeSetiConcept(iconId: string): string {
  const rawName = iconId.replace(/^seti_/, '');
  const parts = rawName.split('_');
  const lastPart = parts.at(-1);

  if (lastPart && SETI_COLOR_SUFFIXES.has(lastPart)) {
    parts.pop();
  }

  return parts.join('-').toLowerCase();
}

function normalizeConcept(family: ThemeFamily, iconId: string): string {
  switch (family) {
    case 'material':
      return normalizeMaterialConcept(iconId);
    case 'vscode':
      return normalizeVscodeConcept(iconId);
    case 'seti':
      return normalizeSetiConcept(iconId);
  }
}

function getFamilyEntry(
  concepts: Map<string, FamilyEntry>,
  concept: string,
): FamilyEntry {
  let entry = concepts.get(concept);

  if (!entry) {
    entry = {
      material: new Map<string, IconRef>(),
      vscode: new Map<string, IconRef>(),
      seti: new Map<string, IconRef>(),
    };
    concepts.set(concept, entry);
  }

  return entry;
}

function addManifestConcepts(
  concepts: Map<string, FamilyEntry>,
  family: ThemeFamily,
  manifest: Manifest,
) {
  for (const iconId of collectReferencedIconIds(manifest)) {
    const definition = getIconDefinition(manifest, iconId);

    if (!definition?.iconPath) {
      continue;
    }

    const concept = normalizeConcept(family, iconId);
    const familyEntry = getFamilyEntry(concepts, concept);
    const cell = familyEntry[family];

    if (!cell.has(definition.iconPath)) {
      cell.set(definition.iconPath, {
        iconId,
        iconPath: definition.iconPath,
      });
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderIcon(icon: IconRef): string {
  const src = `./public${icon.iconPath}`;
  const label = escapeHtml(icon.iconId);

  return `<img src="${src}" alt="${label}" title="${label}" width="20" height="20" />`;
}

function renderCell(cell: Map<string, IconRef>): string {
  if (cell.size === 0) {
    return '-';
  }

  return [...cell.values()]
    .sort((left, right) =>
      left.iconId.localeCompare(right.iconId, 'en', { sensitivity: 'base' }),
    )
    .map(renderIcon)
    .join(' ');
}

function renderTable(concepts: Map<string, FamilyEntry>): string {
  const rows = [...concepts.entries()]
    .sort(([left], [right]) =>
      left.localeCompare(right, 'en', { sensitivity: 'base' }),
    )
    .map(
      ([concept, entry]) =>
        `| \`${concept}\` | ${renderCell(entry.material)} | ${renderCell(entry.vscode)} | ${renderCell(entry.seti)} |`,
    );

  return [
    '| icon name | material icon | vscode icon | seti icon |',
    '| --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}

function renderReadme(table: string): string {
  const materialPackList = SUPPORTED_MATERIAL_PACKS.map(
    (pack) => `\`${pack}\``,
  ).join(', ');
  const allPackList = ALL_THEME_PACKS.map((pack) => `\`${pack}\``).join(', ');

  return `# GitHub Material Icons

Cross-browser browser extension built with WXT that replaces GitHub file and folder icons in GitHub repository views.

## What It Does

- Replaces GitHub's default tree and list octicons with resolved theme icons.
- Handles repository root views, nested tree views, and compact labels like \`.github/workflows\`.
- Resolves common file cases such as \`index.html\`, \`build.yaml\`, and \`release.yml\`.
- Persists enabled state and active icon pack in extension storage.

## Theme Support

The project currently generates manifests from three upstream theme families:

- Material Icon Theme
- VSCode Icons
- Seti UI

The runtime generates these Material pack variants:

- ${materialPackList}

The popup exposes every generated pack:

- ${allPackList}

The table below is generated from the live manifest mappings used by the extension. Material icons are aggregated across every generated Material pack, and light-theme definitions are included when they are reachable through the resolver.

<!-- Generated by scripts/update-readme.ts -->

${table}

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`

Useful scripts:

- \`npm run dev\` builds assets, prepares WXT, and starts Chrome development mode.
- \`npm run dev:firefox\` starts Firefox development mode.
- \`npm run build\` builds the Chrome bundle into \`output/\`.
- \`npm run build:firefox\` builds the Firefox bundle into \`output/\`.
- \`npm run build:safari\` builds the Safari web-extension target into \`output/\`.
- \`npm run zip\` creates the Chrome zip artifact.
- \`npm run zip:firefox\` creates the Firefox zip artifact.
- \`npm run compile\` runs TypeScript type checking with \`tsc --noEmit\`.
- \`npm run sync:assets\` regenerates icons and manifests from upstream theme packages, and fails if any generated icon definition is unreachable.
- \`npm run sync:readme\` regenerates this README table from the current manifests.

## Build Notes

- WXT writes extension artifacts to \`output/\`.
- Safari support is built through WXT's Safari target. The separate Xcode wrapper / App Store packaging step is still outside this repo.

## How Icon Assets Are Generated

\`npm run sync:assets\` runs [\`scripts/copy-icons.ts\`](./scripts/copy-icons.ts), which:

- Copies Material Icon Theme SVG assets into [\`public/icons\`](./public/icons).
- Extracts VSCode Icons SVGs from the upstream icon data packages.
- Builds Seti SVGs from Seti definitions and color mappings.
- Writes normalized manifest JSON files into [\`public/manifests\`](./public/manifests).
- Regenerates [\`src/generated/theme-packs.ts\`](./src/generated/theme-packs.ts).
- Verifies that every generated icon definition is reachable through at least one resolver mapping.

## Runtime Flow

1. The content script watches GitHub file-entry icons and maps each row back to a repo-relative path.
2. The active manifest is loaded on demand from \`public/manifests\`.
3. The resolver matches folders, filenames, extensions, and language fallbacks to an icon definition.
4. The adapter swaps GitHub's SVG octicon for the resolved icon image in place.

## Current Storage Keys

- \`local:extension-enabled\`
- \`local:active-icon-pack\`
`;
}

function main() {
  const concepts = new Map<string, FamilyEntry>();

  for (const pack of SUPPORTED_MATERIAL_PACKS) {
    addManifestConcepts(concepts, 'material', loadManifest(pack));
  }

  addManifestConcepts(concepts, 'vscode', loadManifest('vscode-icons'));
  addManifestConcepts(concepts, 'seti', loadManifest('seti'));

  writeFileSync(readmePath, renderReadme(renderTable(concepts)));
}

main();
