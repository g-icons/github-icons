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
  'seti',
  'symbols',
  'catppuccin',
  'great-icons',
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

type ManifestMapKey =
  | 'fileNames'
  | 'fileExtensions'
  | 'languageIds'
  | 'folderNames'
  | 'folderNamesExpanded'
  | 'rootFolderNames'
  | 'rootFolderNamesExpanded';

const SCRIPT_FILE_EXTENSIONS = [
  'ts',
  'tsx',
  'js',
  'jsx',
  'mts',
  'cts',
  'mjs',
  'cjs',
] as const;

const COMPONENT_FILE_EXTENSIONS = [
  ...SCRIPT_FILE_EXTENSIONS,
  'html',
  'css',
  'scss',
  'sass',
  'less',
  'styl',
] as const;

const ROLE_EXTENSION_ALIASES: Record<string, readonly string[]> = {
  action: SCRIPT_FILE_EXTENSIONS.map((extension) => `action.${extension}`),
  actions: SCRIPT_FILE_EXTENSIONS.map((extension) => `actions.${extension}`),
  component: COMPONENT_FILE_EXTENSIONS.map(
    (extension) => `component.${extension}`,
  ),
  controller: SCRIPT_FILE_EXTENSIONS.map(
    (extension) => `controller.${extension}`,
  ),
  decorator: SCRIPT_FILE_EXTENSIONS.map(
    (extension) => `decorator.${extension}`,
  ),
  directive: COMPONENT_FILE_EXTENSIONS.map(
    (extension) => `directive.${extension}`,
  ),
  effects: SCRIPT_FILE_EXTENSIONS.map((extension) => `effects.${extension}`),
  entity: SCRIPT_FILE_EXTENSIONS.map((extension) => `entity.${extension}`),
  filter: SCRIPT_FILE_EXTENSIONS.map((extension) => `filter.${extension}`),
  gateway: SCRIPT_FILE_EXTENSIONS.map((extension) => `gateway.${extension}`),
  guard: SCRIPT_FILE_EXTENSIONS.map((extension) => `guard.${extension}`),
  interceptor: SCRIPT_FILE_EXTENSIONS.map(
    (extension) => `interceptor.${extension}`,
  ),
  middleware: SCRIPT_FILE_EXTENSIONS.map(
    (extension) => `middleware.${extension}`,
  ),
  module: SCRIPT_FILE_EXTENSIONS.map((extension) => `module.${extension}`),
  pipe: SCRIPT_FILE_EXTENSIONS.map((extension) => `pipe.${extension}`),
  reducer: SCRIPT_FILE_EXTENSIONS.map((extension) => `reducer.${extension}`),
  resolver: SCRIPT_FILE_EXTENSIONS.map(
    (extension) => `resolver.${extension}`,
  ),
  selector: SCRIPT_FILE_EXTENSIONS.map((extension) => `selector.${extension}`),
  selectors: SCRIPT_FILE_EXTENSIONS.map(
    (extension) => `selectors.${extension}`,
  ),
  service: SCRIPT_FILE_EXTENSIONS.map((extension) => `service.${extension}`),
  state: SCRIPT_FILE_EXTENSIONS.map((extension) => `state.${extension}`),
  store: SCRIPT_FILE_EXTENSIONS.map((extension) => `store.${extension}`),
};

const MATERIAL_GLOBAL_FILE_ALIASES: Record<string, readonly string[]> = {
  routing: [
    'routing.ts',
    'routing.tsx',
    'routing.js',
    'router.ts',
    'router.tsx',
    'router.js',
    'routes.ts',
    'routes.tsx',
    'routes.js',
  ],
  silverstripe: ['ss'],
};

const MATERIAL_PACK_FILE_ALIASES: Partial<Record<MaterialPackId, Record<string, readonly string[]>>> = {
  angular: {
    'angular-component': ROLE_EXTENSION_ALIASES.component,
    'angular-guard': ROLE_EXTENSION_ALIASES.guard,
    'angular-service': ROLE_EXTENSION_ALIASES.service,
    'angular-pipe': ROLE_EXTENSION_ALIASES.pipe,
    'angular-directive': ROLE_EXTENSION_ALIASES.directive,
    'angular-resolver': ROLE_EXTENSION_ALIASES.resolver,
    'angular-interceptor': ROLE_EXTENSION_ALIASES.interceptor,
  },
  angular_ngrx: {
    'ngrx-reducer': ROLE_EXTENSION_ALIASES.reducer,
    'ngrx-state': ROLE_EXTENSION_ALIASES.state,
    'ngrx-actions': ROLE_EXTENSION_ALIASES.actions,
    'ngrx-effects': ROLE_EXTENSION_ALIASES.effects,
    'ngrx-entity': ROLE_EXTENSION_ALIASES.entity,
    'ngrx-selectors': ROLE_EXTENSION_ALIASES.selectors,
  },
  nest: {
    'nest-controller': ROLE_EXTENSION_ALIASES.controller,
    'nest-middleware': ROLE_EXTENSION_ALIASES.middleware,
    'nest-module': ROLE_EXTENSION_ALIASES.module,
    'nest-service': ROLE_EXTENSION_ALIASES.service,
    'nest-decorator': ROLE_EXTENSION_ALIASES.decorator,
    'nest-pipe': ROLE_EXTENSION_ALIASES.pipe,
    'nest-filter': ROLE_EXTENSION_ALIASES.filter,
    'nest-gateway': ROLE_EXTENSION_ALIASES.gateway,
    'nest-guard': ROLE_EXTENSION_ALIASES.guard,
    'nest-resolver': ROLE_EXTENSION_ALIASES.resolver,
    'nest-interceptor': ROLE_EXTENSION_ALIASES.interceptor,
  },
  react_redux: {
    'redux-action': ROLE_EXTENSION_ALIASES.actions,
    'redux-reducer': ROLE_EXTENSION_ALIASES.reducer,
    'redux-selector': ROLE_EXTENSION_ALIASES.selectors,
    'redux-store': ROLE_EXTENSION_ALIASES.store,
  },
  default: {
    controller: ROLE_EXTENSION_ALIASES.controller,
    routing: MATERIAL_GLOBAL_FILE_ALIASES.routing,
  },
  bashly: {
    controller: ROLE_EXTENSION_ALIASES.controller,
    routing: MATERIAL_GLOBAL_FILE_ALIASES.routing,
  },
};

const MATERIAL_PACK_FOLDER_ALIASES: Partial<Record<MaterialPackId, Record<string, readonly string[]>>> = {
  angular_ngrx: {
    'folder-ngrx-actions': ['actions'],
    'folder-ngrx-effects': ['effects'],
    'folder-ngrx-entities': ['entities'],
    'folder-ngrx-reducer': ['reducers'],
    'folder-ngrx-selectors': ['selectors'],
    'folder-ngrx-state': ['state'],
    'folder-ngrx-store': ['store'],
  },
  react: {
    'folder-react-components': ['components'],
  },
  react_redux: {
    'folder-react-components': ['components'],
    'folder-redux-actions': ['actions'],
    'folder-redux-reducer': ['reducers'],
    'folder-redux-selector': ['selectors'],
    'folder-redux-store': ['store'],
    'folder-redux-toolkit': ['toolkit'],
  },
  vue: {
    'folder-vue-directives': ['directives'],
  },
  vue_vuex: {
    'folder-vue-directives': ['directives'],
    'folder-vuex-store': ['store'],
  },
};

function getMutableMap(manifest: Manifest, key: ManifestMapKey): Record<string, string> {
  const target = manifest as Manifest & Partial<Record<ManifestMapKey, Record<string, string>>>;
  if (!target[key]) {
    target[key] = {};
  }

  return target[key]!;
}

function addAlias(manifest: Manifest, key: ManifestMapKey, alias: string, iconId: string): boolean {
  const normalizedAlias = alias.trim().toLowerCase();
  if (!normalizedAlias) {
    return false;
  }

  const map = getMutableMap(manifest, key);
  const existing = map[normalizedAlias];

  if (existing && existing !== iconId) {
    return false;
  }

  map[normalizedAlias] = iconId;
  return true;
}

function collectReferencedIconIds(manifest: Manifest): Set<string> {
  const referenced = new Set<string>();
  const addValue = (value: string | undefined) => {
    if (value) {
      referenced.add(value);
    }
  };
  const addMap = (map: Record<string, string> | undefined) => {
    if (!map) {
      return;
    }

    for (const value of Object.values(map)) {
      addValue(value);
    }
  };

  addMap(manifest.fileNames);
  addMap(manifest.fileExtensions);
  addMap(manifest.languageIds);
  addMap(manifest.folderNames);
  addMap(manifest.folderNamesExpanded);
  addMap(manifest.rootFolderNames);
  addMap(manifest.rootFolderNamesExpanded);
  addMap(manifest.light?.fileNames);
  addMap(manifest.light?.fileExtensions);
  addMap(manifest.light?.languageIds);
  addMap(manifest.light?.folderNames);
  addMap(manifest.light?.folderNamesExpanded);
  addMap(manifest.light?.rootFolderNames);
  addMap(manifest.light?.rootFolderNamesExpanded);

  addValue(manifest.file);
  addValue(manifest.folder);
  addValue(manifest.folderExpanded);
  addValue(manifest.rootFolder);
  addValue(manifest.rootFolderExpanded);
  addValue(manifest.light?.file);
  addValue(manifest.light?.folder);
  addValue(manifest.light?.folderExpanded);
  addValue(manifest.light?.rootFolder);
  addValue(manifest.light?.rootFolderExpanded);

  return referenced;
}

function materialFileAlias(iconId: string): string {
  return iconId.replace(/\.clone$/, '').replace(/_/g, '-').toLowerCase();
}

function materialFolderAlias(iconId: string): string {
  return materialFileAlias(iconId)
    .replace(/^folder-/, '')
    .replace(/-open$/, '');
}

function isMaterialFolderIcon(iconId: string): boolean {
  return iconId.startsWith('folder');
}

function isVscodeFolderIcon(iconId: string): boolean {
  return (
    iconId.startsWith('_fd_') ||
    iconId.startsWith('_folder') ||
    iconId.startsWith('_root_folder')
  );
}

function vscodeIconAlias(iconId: string): string {
  if (iconId === '_file') return 'file';
  if (iconId === '_folder') return 'folder';
  if (iconId === '_folder_open') return 'folder-open';
  if (iconId === '_root_folder') return 'root-folder';
  if (iconId === '_root_folder_open') return 'root-folder-open';
  if (iconId.startsWith('_fd_')) {
    return `folder-${iconId.slice(4).replace(/_open$/, '-open').replace(/_/g, '-')}`.toLowerCase();
  }
  if (iconId.startsWith('_f_')) {
    return iconId.slice(3).replace(/_/g, '-').toLowerCase();
  }

  return iconId.replace(/^_+/, '').replace(/_/g, '-').toLowerCase();
}

function addFileAlias(manifest: Manifest, alias: string, iconId: string): boolean {
  return addAlias(manifest, alias.includes('.') ? 'fileExtensions' : 'fileNames', alias, iconId);
}

function addFolderAlias(manifest: Manifest, alias: string, iconId: string, isOpen: boolean): boolean {
  return addAlias(manifest, isOpen ? 'folderNamesExpanded' : 'folderNames', alias, iconId);
}

function applyMaterialPackAliases(manifest: Manifest, pack: MaterialPackId): void {
  const fileAliases = {...MATERIAL_GLOBAL_FILE_ALIASES, ...(MATERIAL_PACK_FILE_ALIASES[pack] ?? {})};
  for (const [iconId, aliases] of Object.entries(fileAliases)) {
    if (!manifest.iconDefinitions?.[iconId]) {
      continue;
    }

    for (const alias of aliases) {
      addFileAlias(manifest, alias, iconId);
    }
  }

  const folderAliases = MATERIAL_PACK_FOLDER_ALIASES[pack] ?? {};
  for (const [iconId, aliases] of Object.entries(folderAliases)) {
    if (manifest.iconDefinitions?.[iconId]) {
      for (const alias of aliases) {
        addFolderAlias(manifest, alias, iconId, false);
      }
    }

    const openIconId = `${iconId}-open`;
    if (manifest.iconDefinitions?.[openIconId]) {
      for (const alias of aliases) {
        addFolderAlias(manifest, alias, openIconId, true);
      }
    }
  }
}

function augmentMaterialManifest(manifest: Manifest, pack: MaterialPackId): Manifest {
  applyMaterialPackAliases(manifest, pack);
  let referenced = collectReferencedIconIds(manifest);
  for (const iconId of Object.keys(manifest.iconDefinitions ?? {})) {
    if (referenced.has(iconId)) {
      continue;
    }

    if (isMaterialFolderIcon(iconId)) {
      const alias = materialFolderAlias(iconId);
      const isOpen = materialFileAlias(iconId).endsWith('-open');
      const didAdd = addFolderAlias(manifest, alias, iconId, isOpen);

      if (!didAdd) {
        addFolderAlias(manifest, `icon-${alias}`, iconId, isOpen);
      }
    } else {
      const alias = materialFileAlias(iconId);
      const didAdd = addFileAlias(manifest, alias, iconId);

      if (!didAdd) {
        addFileAlias(manifest, `icon-${alias}`, iconId);
      }
    }

    referenced = collectReferencedIconIds(manifest);
  }

  return manifest;
}

function augmentVscodeIconsManifest(manifest: Manifest): Manifest {
  let referenced = collectReferencedIconIds(manifest);
  for (const iconId of Object.keys(manifest.iconDefinitions ?? {})) {
    if (referenced.has(iconId)) {
      continue;
    }

    if (isVscodeFolderIcon(iconId)) {
      const alias = vscodeIconAlias(iconId).replace(/^folder-/, '').replace(/-open$/, '');
      const isOpen = vscodeIconAlias(iconId).endsWith('-open');
      const didAdd = addFolderAlias(manifest, alias, iconId, isOpen);
      if (!didAdd) {
        addFolderAlias(manifest, `icon-${alias}`, iconId, isOpen);
      }
    } else {
      const alias = vscodeIconAlias(iconId);
      const didAdd = addFileAlias(manifest, alias, iconId);

      if (!didAdd) {
        addFileAlias(manifest, `icon-${alias}`, iconId);
      }
    }

    referenced = collectReferencedIconIds(manifest);
  }

  return manifest;
}

function createManifestConfig(pack: MaterialPackId): ManifestConfig {
  const activeIconPack = (pack === DEFAULT_THEME_PACK ? '' : pack) as Exclude<MaterialPackId, 'default'>;
  return {activeIconPack};
}

export function buildMaterialThemeManifests(): {
  manifests: Record<MaterialPackId, Manifest>;
  packs: readonly MaterialPackId[];
} {
  const manifests = {} as Record<MaterialPackId, Manifest>;

  for (const pack of SUPPORTED_MATERIAL_PACKS) {
    manifests[pack] = augmentMaterialManifest(normalizeManifest(generateManifest(createManifestConfig(pack))), pack);
  }

  return {manifests, packs: SUPPORTED_MATERIAL_PACKS};
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

function normalizeVscodeIconsDefs(defs: Record<string, {iconPath: string}>): Record<string, { iconPath: string }> {
  return Object.fromEntries(
    Object.entries(defs).filter(([, def]) => def.iconPath).map(([id, def]) => [id, { iconPath: normalizeIconPath(def.iconPath)}]),
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

  return { manifest: augmentVscodeIconsManifest(manifest), svgFilenames };
}

// --- Seti UI ---

const SETI_COLORS: Record<string, string> = {
  blue: '#519aba',
  green: '#8dc149',
  orange: '#e37933',
  pink: '#f55385',
  purple: '#a074c4',
  red: '#cc3e44',
  white: '#d4d7d6',
  yellow: '#cbcb41',
  'grey-light': '#6d8086',
  grey: '#41535b',
  ignore: '#41535b',
};

interface SetiDefinitions {
  files: Record<string, [string, string]>;
  extensions: Record<string, [string, string]>;
  partials: [string, [string, string]][];
  default: [string, string];
}

function setiIconId(icon: string, color: string): string {
  return `seti_${icon}_${color}`;
}

function setiSvgFilename(icon: string, color: string): string {
  return `seti_${icon}_${color}.svg`;
}

export function buildSetiManifest(definitionsPath: string, iconsPath: string): { manifest: Manifest; svgFiles: Map<string, string> } {
  const defs: SetiDefinitions = JSON.parse(readFileSync(definitionsPath, 'utf-8'));
  const icons: Record<string, string> = JSON.parse(readFileSync(iconsPath, 'utf-8'));

  const usedCombos = new Set<string>();
  const iconDefinitions: Record<string, { iconPath: string }> = {};

  function ensureCombo(icon: string, color: string): string {
    const id = setiIconId(icon, color);
    if (!usedCombos.has(id)) {
      usedCombos.add(id);
      iconDefinitions[id] = { iconPath: `/icons/${setiSvgFilename(icon, color)}` };
    }
    return id;
  }

  const [defaultIcon, defaultColor] = defs.default;
  const defaultId = ensureCombo(defaultIcon, defaultColor);

  const fileNames: Record<string, string> = {};
  for (const [filename, [icon, color]] of Object.entries(defs.files)) {
    fileNames[filename] = ensureCombo(icon, color);
  }
  for (const [filename, [icon, color]] of defs.partials) {
    fileNames[filename] = ensureCombo(icon, color);
  }

  const fileExtensions: Record<string, string> = {};
  for (const [ext, [icon, color]] of Object.entries(defs.extensions)) {
    const normalizedExt = ext.startsWith('.') ? ext.slice(1) : ext;
    fileExtensions[normalizedExt] = ensureCombo(icon, color);
  }

  const svgFiles = new Map<string, string>();
  for (const comboId of usedCombos) {
    const parts = comboId.replace('seti_', '').split('_');
    const color = parts.pop()!;
    const icon = parts.join('_');
    const svgBody = icons[icon];
    if (!svgBody) continue;

    const hex = SETI_COLORS[color] ?? SETI_COLORS.white;
    const coloredSvg = svgBody.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" fill="${hex}" `);
    svgFiles.set(setiSvgFilename(icon, color), coloredSvg);
  }

  const manifest: Manifest = {
    iconDefinitions,
    file: defaultId,
    folder: undefined,
    folderExpanded: undefined,
    rootFolder: undefined,
    rootFolderExpanded: undefined,
    folderNames: {},
    folderNamesExpanded: {},
    fileExtensions,
    fileNames,
    languageIds: {},
  };

  return { manifest, svgFiles };
}

// --- Symbols ---

interface SymbolsRawManifest {
  iconDefinitions: Record<string, { iconPath: string }>;
  file: string;
  folder: string;
  fileExtensions: Record<string, string>;
  fileNames: Record<string, string>;
  languageIds: Record<string, string>;
  folderNames: Record<string, string>;
}

export function buildSymbolsManifest(themeJsonPath: string): { manifest: Manifest; iconSources: Map<string, string> } {
  const raw: SymbolsRawManifest = JSON.parse(readFileSync(themeJsonPath, 'utf-8'));
  const themeDir = path.dirname(themeJsonPath);

  const iconDefinitions: Record<string, { iconPath: string }> = {};
  const iconSources = new Map<string, string>();

  for (const [id, def] of Object.entries(raw.iconDefinitions)) {
    const trimmedPath = def.iconPath.trim();
    const originalBasename = path.posix.basename(trimmedPath);
    const prefixedName = `symbols_${originalBasename}`;
    iconDefinitions[id] = { iconPath: `/icons/${prefixedName}` };
    iconSources.set(prefixedName, path.resolve(themeDir, trimmedPath));
  }

  const manifest: Manifest = {
    iconDefinitions,
    file: raw.file,
    folder: raw.folder,
    folderExpanded: undefined,
    rootFolder: undefined,
    rootFolderExpanded: undefined,
    folderNames: raw.folderNames ?? {},
    folderNamesExpanded: {},
    fileExtensions: raw.fileExtensions,
    fileNames: raw.fileNames,
    languageIds: raw.languageIds ?? {},
  };

  const referenced = collectReferencedIconIds(manifest);
  for (const id of Object.keys(iconDefinitions)) {
    if (!referenced.has(id)) {
      delete iconDefinitions[id];
      const prefixedName = `symbols_${path.posix.basename(raw.iconDefinitions[id].iconPath.trim())}`;
      iconSources.delete(prefixedName);
    }
  }

  return { manifest, iconSources };
}

// --- Catppuccin ---

interface CatppuccinRawManifest {
  iconDefinitions: Record<string, { iconPath: string }>;
  file: string;
  folder: string;
  folderExpanded: string;
  rootFolder: string;
  rootFolderExpanded: string;
  fileExtensions: Record<string, string>;
  fileNames: Record<string, string>;
  languageIds: Record<string, string>;
  folderNames: Record<string, string>;
  folderNamesExpanded: Record<string, string>;
}

export function buildCatppuccinManifest(themeJsonPath: string): { manifest: Manifest; svgFilenames: string[] } {
  const raw: CatppuccinRawManifest = JSON.parse(readFileSync(themeJsonPath, 'utf-8'));

  const iconDefinitions: Record<string, { iconPath: string }> = {};
  const svgFilenames: string[] = [];

  for (const [id, def] of Object.entries(raw.iconDefinitions)) {
    const basename = path.posix.basename(def.iconPath);
    const prefixed = `catppuccin_${basename}`;
    iconDefinitions[id] = { iconPath: `/icons/${prefixed}` };
    svgFilenames.push(basename);
  }

  const manifest: Manifest = {
    iconDefinitions,
    file: raw.file,
    folder: raw.folder,
    folderExpanded: raw.folderExpanded,
    rootFolder: raw.rootFolder,
    rootFolderExpanded: raw.rootFolderExpanded,
    folderNames: raw.folderNames ?? {},
    folderNamesExpanded: raw.folderNamesExpanded ?? {},
    fileExtensions: raw.fileExtensions,
    fileNames: raw.fileNames,
    languageIds: raw.languageIds ?? {},
  };

  const referenced = collectReferencedIconIds(manifest);
  const filteredFilenames: string[] = [];
  for (const id of Object.keys(iconDefinitions)) {
    if (referenced.has(id)) {
      filteredFilenames.push(path.posix.basename(raw.iconDefinitions[id].iconPath));
    } else {
      delete iconDefinitions[id];
    }
  }

  return { manifest, svgFilenames: filteredFilenames };
}

// --- Great Icons ---

export function buildGreatIconsManifest(themeJsonPath: string): { manifest: Manifest; iconSources: Map<string, string> } {
  const raw: CatppuccinRawManifest = JSON.parse(readFileSync(themeJsonPath, 'utf-8'));
  const themeDir = path.dirname(themeJsonPath);

  const iconDefinitions: Record<string, { iconPath: string }> = {};
  const iconSources = new Map<string, string>();

  for (const [id, def] of Object.entries(raw.iconDefinitions)) {
    const basename = path.posix.basename(def.iconPath);
    const prefixed = `greaticons_${basename}`;
    iconDefinitions[id] = { iconPath: `/icons/${prefixed}` };
    iconSources.set(prefixed, path.resolve(themeDir, def.iconPath));
  }

  const manifest: Manifest = {
    iconDefinitions,
    file: raw.file,
    folder: raw.folder,
    folderExpanded: raw.folderExpanded,
    rootFolder: raw.rootFolder,
    rootFolderExpanded: raw.rootFolderExpanded,
    folderNames: raw.folderNames ?? {},
    folderNamesExpanded: raw.folderNamesExpanded ?? {},
    fileExtensions: raw.fileExtensions,
    fileNames: raw.fileNames,
    languageIds: raw.languageIds ?? {},
  };

  const referenced = collectReferencedIconIds(manifest);
  for (const id of Object.keys(iconDefinitions)) {
    if (!referenced.has(id)) {
      delete iconDefinitions[id];
      const prefixed = `greaticons_${path.posix.basename(raw.iconDefinitions[id].iconPath)}`;
      iconSources.delete(prefixed);
    }
  }

  return { manifest, iconSources };
}
