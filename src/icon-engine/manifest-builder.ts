import * as path from 'node:path';
import * as materialTheme from 'material-icon-theme';
import type { Manifest, ManifestConfig } from 'material-icon-theme';

import type { ThemePackId } from './types';

const { availableIconPacks, generateManifest } = materialTheme;

export const DEFAULT_THEME_PACK: ThemePackId = 'default';

const namedThemePacks = availableIconPacks as Exclude<ThemePackId, 'default'>[];

export const SUPPORTED_THEME_PACKS: readonly ThemePackId[] = [
  DEFAULT_THEME_PACK,
  ...namedThemePacks,
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

function createManifestConfig(pack: ThemePackId): ManifestConfig {
  const activeIconPack = (pack === DEFAULT_THEME_PACK ? '' : pack) as Exclude<
    ThemePackId,
    'default'
  >;

  return {
    activeIconPack,
  };
}

export function buildMaterialThemeManifests(): {
  manifests: Record<ThemePackId, Manifest>;
  packs: readonly ThemePackId[];
} {
  const manifests = {} as Record<ThemePackId, Manifest>;

  for (const pack of SUPPORTED_THEME_PACKS) {
    manifests[pack] = normalizeManifest(generateManifest(createManifestConfig(pack)));
  }

  return {
    manifests,
    packs: SUPPORTED_THEME_PACKS,
  };
}
