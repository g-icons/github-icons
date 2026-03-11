import type { Manifest } from 'material-icon-theme';
import { browser } from 'wxt/browser';
import type { PublicPath } from 'wxt/browser';

import type { IconQuery, ResolvedIcon } from './types';

function resolveIconById(
  manifest: Manifest,
  iconId: string | undefined,
): ResolvedIcon | null {
  if (!iconId) {
    return null;
  }

  const definition = manifest.iconDefinitions?.[iconId];
  if (!definition) {
    return null;
  }

  return {
    iconId,
    iconPath: definition.iconPath,
    url: browser.runtime.getURL(definition.iconPath as PublicPath),
  };
}

function resolveExactMatch(
  map: Record<string, string> | undefined,
  value: string,
): string | undefined {
  if (!map) {
    return undefined;
  }

  return map[value] ?? map[value.toLowerCase()];
}

function resolveFileExtension(
  map: Record<string, string> | undefined,
  filename: string,
): string | undefined {
  if (!map) {
    return undefined;
  }

  const normalizedName = filename.toLowerCase();
  const parts = normalizedName.split('.');

  if (parts.length < 2) {
    return undefined;
  }

  for (let index = 1; index < parts.length; index += 1) {
    const candidate = parts.slice(index).join('.');
    const match = map[candidate];
    if (match) {
      return match;
    }
  }

  return undefined;
}

function resolveDirectoryIconId(
  manifest: Manifest,
  filename: string,
  query: IconQuery,
): string | undefined {
  const folderNames = query.isRoot
    ? query.isOpen
      ? manifest.rootFolderNamesExpanded
      : manifest.rootFolderNames
    : query.isOpen
      ? manifest.folderNamesExpanded
      : manifest.folderNames;

  return (
    resolveExactMatch(folderNames, filename) ??
    (query.isRoot
      ? query.isOpen
        ? manifest.rootFolderExpanded
        : manifest.rootFolder
      : query.isOpen
        ? manifest.folderExpanded
        : manifest.folder)
  );
}

function resolveFileIconId(manifest: Manifest, filename: string): string | undefined {
  return (
    resolveExactMatch(manifest.fileNames, filename) ??
    resolveFileExtension(manifest.fileExtensions, filename) ??
    manifest.file
  );
}

export function resolveManifestIcon(
  manifest: Manifest,
  query: IconQuery,
): ResolvedIcon | null {
  const filename = query.filename.trim();

  if (!filename) {
    return null;
  }

  const iconId =
    query.type === 'directory'
      ? resolveDirectoryIconId(manifest, filename, query)
      : resolveFileIconId(manifest, filename);

  return resolveIconById(manifest, iconId);
}
