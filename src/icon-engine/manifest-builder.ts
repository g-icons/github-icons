import * as path from 'node:path';
import { readFileSync } from 'node:fs';
import * as materialTheme from 'material-icon-theme';
import type { Manifest, ManifestConfig } from 'material-icon-theme';

import type { MaterialPackId, ThemePackId } from './types';

const { availableIconPacks, generateManifest } = materialTheme;

export const DEFAULT_THEME_PACK: ThemePackId = 'default';

const namedThemePacks = availableIconPacks as Exclude<MaterialPackId, 'default'>[];

export const SUPPORTED_MATERIAL_PACKS: readonly MaterialPackId[] = [
  DEFAULT_THEME_PACK as MaterialPackId,
  ...namedThemePacks,
];

export const ALL_THEME_PACKS: readonly ThemePackId[] = [
  ...SUPPORTED_MATERIAL_PACKS,
  'vscode-icons',
];

function normalizeIconPath(iconPath: string): string {
  return `/icons/${path.posix.basename(iconPath)}`;
}

function normalizeManifest(manifest: Manifest): Manifest {
  return {
    ...manifest,
    iconDefinitions: Object.fromEntries(
      Object.entries(manifest.iconDefinitions ?? {}).map(([iconId, definition]) => [
        iconId,
        {
          iconPath: normalizeIconPath(definition.iconPath),
        },
      ]),
    ),
    highContrast: manifest.highContrast
      ? normalizeManifest(manifest.highContrast)
      : undefined,
    light: manifest.light ? normalizeManifest(manifest.light) : undefined,
  };
}

function createManifestConfig(pack: MaterialPackId): ManifestConfig {
  const activeIconPack = (pack === DEFAULT_THEME_PACK ? '' : pack) as Exclude<
    MaterialPackId,
    'default'
  >;

  return {
    activeIconPack,
  };
}

export function buildMaterialThemeManifests(): {
  manifests: Record<MaterialPackId, Manifest>;
  packs: readonly MaterialPackId[];
} {
  const manifests = {} as Record<MaterialPackId, Manifest>;

  for (const pack of SUPPORTED_MATERIAL_PACKS) {
    manifests[pack] = normalizeManifest(generateManifest(createManifestConfig(pack)));
  }

  return {
    manifests,
    packs: SUPPORTED_MATERIAL_PACKS,
  };
}

interface VscodeIconsRawManifest {
  iconDefinitions: Record<string, { iconPath: string }>;
  file: string;
  folder: string;
  folderExpanded: string;
  rootFolder: string;
  rootFolderExpanded: string;
  folderNames: Record<string, string>;
  folderNamesExpanded: Record<string, string>;
  fileExtensions: Record<string, string>;
  fileNames: Record<string, string>;
  languageIds: Record<string, string>;
  light?: {
    file?: string;
    folder?: string;
    folderExpanded?: string;
    rootFolder?: string;
    rootFolderExpanded?: string;
    folderNames?: Record<string, string>;
    folderNamesExpanded?: Record<string, string>;
    fileExtensions?: Record<string, string>;
    fileNames?: Record<string, string>;
    languageIds?: Record<string, string>;
  };
}

function normalizeVscodeIconsDefs(defs: Record<string, { iconPath: string }>): Record<string, { iconPath: string }> {
  return Object.fromEntries(
    Object.entries(defs)
      .filter(([, def]) => def.iconPath)
      .map(([id, def]) => [id, { iconPath: normalizeIconPath(def.iconPath) }]),
  );
}

export function buildVscodeIconsManifest(iconsJsonPath: string): { manifest: Manifest; svgFilenames: string[] } {
  const raw: VscodeIconsRawManifest = JSON.parse(readFileSync(iconsJsonPath, 'utf-8'));

  const normalizedDefs = normalizeVscodeIconsDefs(raw.iconDefinitions);

  const svgFilenames: string[] = [];
  for (const def of Object.values(raw.iconDefinitions)) {
    if (def.iconPath) {
      svgFilenames.push(path.posix.basename(def.iconPath));
    }
  }

  const manifest: Manifest = {
    iconDefinitions: normalizedDefs,
    file: raw.file,
    folder: raw.folder,
    folderExpanded: raw.folderExpanded,
    rootFolder: raw.rootFolder,
    rootFolderExpanded: raw.rootFolderExpanded,
    folderNames: raw.folderNames,
    folderNamesExpanded: raw.folderNamesExpanded,
    fileExtensions: raw.fileExtensions,
    fileNames: raw.fileNames,
    languageIds: raw.languageIds,
    light: raw.light ? {
      file: raw.light.file,
      folder: raw.light.folder,
      folderExpanded: raw.light.folderExpanded,
      rootFolder: raw.light.rootFolder,
      rootFolderExpanded: raw.light.rootFolderExpanded,
      folderNames: raw.light.folderNames,
      folderNamesExpanded: raw.light.folderNamesExpanded,
      fileExtensions: raw.light.fileExtensions,
      fileNames: raw.light.fileNames,
      languageIds: raw.light.languageIds,
    } as Manifest : undefined,
  };

  return { manifest, svgFilenames };
}
