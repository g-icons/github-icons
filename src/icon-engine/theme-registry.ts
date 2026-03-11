import type { Manifest } from 'material-icon-theme';
import { browser } from 'wxt/browser';

import { materialThemeIconPacks } from '../generated/material-theme-packs';
import { resolveManifestIcon } from './resolver';
import type { IconQuery, ResolvedIcon, ThemePackId, ThemeProvider } from './types';

export const DEFAULT_THEME_NAME = 'material';

const manifestCache = new Map<ThemePackId, Promise<Manifest>>();

function isSupportedPack(pack: string): pack is ThemePackId {
  return (materialThemeIconPacks as readonly string[]).includes(pack);
}

async function fetchManifest(pack: ThemePackId): Promise<Manifest> {
  const response = await fetch(
    browser.runtime.getURL(`/manifests/${pack}.json` as never),
  );
  if (!response.ok) {
    throw new Error(`Failed to load manifest for icon pack "${pack}".`);
  }

  return (await response.json()) as Manifest;
}

function loadManifest(pack: ThemePackId): Promise<Manifest> {
  const cached = manifestCache.get(pack);
  if (cached) {
    return cached;
  }

  const request = fetchManifest(pack).catch((error) => {
    manifestCache.delete(pack);
    throw error;
  });

  manifestCache.set(pack, request);
  return request;
}

class MaterialThemeProvider implements ThemeProvider {
  public readonly name = DEFAULT_THEME_NAME;

  private activePack: ThemePackId;

  private activeManifest: Manifest | null = null;

  private loadVersion = 0;

  constructor(initialPack: ThemePackId) {
    this.activePack = isSupportedPack(initialPack) ? initialPack : 'default';
  }

  resolveIcon(query: IconQuery): ResolvedIcon | null {
    if (!this.activeManifest) {
      return null;
    }

    return resolveManifestIcon(this.activeManifest, query);
  }

  getAvailableIconPacks(): readonly ThemePackId[] {
    return materialThemeIconPacks;
  }

  getActiveIconPack(): ThemePackId {
    return this.activePack;
  }

  async setIconPack(pack: ThemePackId): Promise<void> {
    let resolvedPack: ThemePackId = isSupportedPack(pack) ? pack : 'default';
    const loadVersion = ++this.loadVersion;

    let manifest: Manifest;

    try {
      manifest = await loadManifest(resolvedPack);
    } catch (error) {
      if (resolvedPack === 'default') {
        throw error;
      }

      resolvedPack = 'default';
      manifest = await loadManifest(resolvedPack);
    }

    if (loadVersion !== this.loadVersion) {
      return;
    }

    this.activePack = resolvedPack;
    this.activeManifest = manifest;
  }
}

export function createThemeProvider(
  initialPack: ThemePackId = 'default',
): ThemeProvider {
  return new MaterialThemeProvider(initialPack);
}
