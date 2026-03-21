import type { Manifest } from 'material-icon-theme';
import { browser } from 'wxt/browser';
import type { PublicPath } from 'wxt/browser';
import type { IconQuery, ResolvedIcon } from './types';

const LANGUAGE_EXTENSION_ALIASES: Record<string, string> = {
  htm: 'html',
  yml: 'yaml',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascriptreact',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'typescriptreact',
};

function normalizeLabel(value: string): string {
  return value.trim().replace(/\s*\/\s*/g, '/').replace(/\/+/g, '/');
}

function splitPathSegments(value: string): string[] {
  return normalizeLabel(value).split('/').filter(Boolean);
}

function getBaseName(value: string): string {
  const segments = splitPathSegments(value);
  return segments.at(-1) ?? value;
}

function resolveIconById(manifest: Manifest, iconId: string | undefined): ResolvedIcon | null {
  if (!iconId) {
    return null;
  }

  const definition = manifest.iconDefinitions?.[iconId];
  if (!definition) {
    return null;
  }

  return {iconId, iconPath: definition.iconPath, url: browser.runtime.getURL(definition.iconPath as PublicPath)};
}

function getEffectiveManifest(manifest: Manifest, preferLight: boolean | undefined): Manifest {
  if (!preferLight || !manifest.light) {
    return manifest;
  }

  return {...manifest, ...manifest.light, iconDefinitions: {...(manifest.iconDefinitions ?? {}), ...(manifest.light.iconDefinitions ?? {})}};
}

function resolveExactMatch(map: Record<string, string> | undefined, value: string): string | undefined {
  if (!map) {
    return undefined;
  }

  const normalizedValue = normalizeLabel(value);

  return map[normalizedValue] ?? map[normalizedValue.toLowerCase()];
}

function resolveFileCandidates(filename: string): string[] {
  const baseName = getBaseName(normalizeLabel(filename)).toLowerCase();
  const parts = baseName.split('.');

  if (parts.length < 2) {
    return [];
  }

  const candidates: string[] = [];

  for (let index = 1; index < parts.length; index += 1) {
    candidates.push(parts.slice(index).join('.'));
  }

  return candidates;
}

function resolveFileExtension(map: Record<string, string> | undefined, filename: string): string | undefined {
  if (!map) {
    return undefined;
  }

  for (const candidate of resolveFileCandidates(filename)) {
    const match = map[candidate];
    if (match) {
      return match;
    }
  }

  return undefined;
}

function resolveLanguageFallback(manifest: Manifest, filename: string): string | undefined {
  const languageIds = manifest.languageIds;
  if (!languageIds) {
    return undefined;
  }

  for (const candidate of resolveFileCandidates(filename)) {
    const match = languageIds[candidate] ?? languageIds[LANGUAGE_EXTENSION_ALIASES[candidate]];
    if (match) {
      return match;
    }
  }

  return undefined;
}

function resolveDirectoryCandidates(filename: string): string[] {
  const normalizedName = normalizeLabel(filename);
  const segments = splitPathSegments(normalizedName);

  if (segments.length === 0) {
    return [];
  }

  const lastSegment = segments.at(-1)!;

  if (segments.length === 1) {
    return [lastSegment];
  }

  return [lastSegment, normalizedName];
}

function resolveDirectoryIconId(manifest: Manifest, filename: string, query: IconQuery): string | undefined {
  const folderNames = query.isRoot
    ? query.isOpen ? (manifest.rootFolderNamesExpanded ?? manifest.rootFolderNames) : manifest.rootFolderNames
    : query.isOpen ? (manifest.folderNamesExpanded ?? manifest.folderNames) : manifest.folderNames;
  for (const candidate of resolveDirectoryCandidates(filename)) {
    const match = resolveExactMatch(folderNames, candidate);
    if (match) {
      return match;
    }
  }

  if (query.isRoot) {
    return query.isOpen ? (manifest.rootFolderExpanded ?? manifest.rootFolder) : manifest.rootFolder;
  }

  return query.isOpen ? (manifest.folderExpanded ?? manifest.folder) : manifest.folder;
}

function resolveFileIconId(manifest: Manifest, filename: string): string | undefined {
  const normalizedFilename = normalizeLabel(filename);
  const baseName = getBaseName(normalizedFilename);

  return (resolveExactMatch(manifest.fileNames, normalizedFilename) ?? resolveExactMatch(manifest.fileNames, baseName) ?? resolveFileExtension(manifest.fileExtensions, filename) ?? resolveLanguageFallback(manifest, filename) ?? manifest.file);
}

export function resolveManifestIcon(manifest: Manifest, query: IconQuery): ResolvedIcon | null {
  const activeManifest = getEffectiveManifest(manifest, query.preferLight);
  const filename = normalizeLabel(query.filename);

  if (!filename) {
    return null;
  }

  const iconId = query.type === 'directory' ? resolveDirectoryIconId(activeManifest, filename, query) : resolveFileIconId(activeManifest, filename);
  return resolveIconById(activeManifest, iconId);
}
