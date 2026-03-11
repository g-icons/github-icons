import {
  materialThemeIconPacks,
  materialThemeManifests,
} from '../generated/material-theme';
import { resolveManifestIcon } from './resolver';
import type { IconQuery, ResolvedIcon, ThemePackId, ThemeProvider } from './types';

export const DEFAULT_THEME_NAME = 'material';

class MaterialThemeProvider implements ThemeProvider {
  public readonly name = DEFAULT_THEME_NAME;

  private activePack: ThemePackId;

  constructor(initialPack: ThemePackId) {
    this.activePack = initialPack;
  }

  resolveIcon(query: IconQuery): ResolvedIcon | null {
    return resolveManifestIcon(
      materialThemeManifests[this.activePack] ?? materialThemeManifests.default,
      query,
    );
  }

  getAvailableIconPacks(): readonly ThemePackId[] {
    return materialThemeIconPacks;
  }

  getActiveIconPack(): ThemePackId {
    return this.activePack;
  }

  setIconPack(pack: ThemePackId) {
    this.activePack = materialThemeManifests[pack] ? pack : 'default';
  }
}

export function createThemeProvider(
  initialPack: ThemePackId = 'default',
): ThemeProvider {
  return new MaterialThemeProvider(initialPack);
}
