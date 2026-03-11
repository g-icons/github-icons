import { detectSiteAdapter } from '../src/adapters/registry';
import type { FileEntry, SiteAdapter } from '../src/adapters/types';
import { createThemeProvider } from '../src/icon-engine/theme-registry';
import type { ThemePackId, ThemeProvider } from '../src/icon-engine/types';
import {
  activeIconPack,
  extensionEnabled,
  getExtensionSettings,
} from '../src/storage/settings';

class ContentOrchestrator {
  private readonly adapter: SiteAdapter | null;

  private readonly themeProvider: ThemeProvider;

  private stopObserving: (() => void) | null = null;

  constructor() {
    this.adapter = detectSiteAdapter();
    this.themeProvider = createThemeProvider();
  }

  async start() {
    if (!this.adapter) {
      return;
    }

    const settings = await getExtensionSettings();
    await this.themeProvider.setIconPack(settings.iconPack);

    if (settings.enabled) {
      this.enable();
    } else {
      this.adapter.restoreIcons();
    }

    extensionEnabled.watch((enabled) => {
      if (!this.adapter) {
        return;
      }

      if (enabled) {
        this.enable();
      } else {
        this.disable();
      }
    });

    activeIconPack.watch((iconPack) => {
      void this.applyIconPack(iconPack);
    });

    document.addEventListener(
      'turbo:before-cache',
      () => this.adapter?.restoreIcons(),
      { capture: true },
    );

    document.addEventListener(
      'turbo:render',
      () => {
        if (this.stopObserving) {
          this.restart();
        }
      },
      { capture: true },
    );
  }

  private enable() {
    if (!this.adapter || this.stopObserving) {
      return;
    }

    this.stopObserving = this.adapter.observeFileEntries((entries) => {
      for (const entry of entries) {
        this.applyIcon(entry);
      }
    });
  }

  private disable() {
    this.stopObserving?.();
    this.stopObserving = null;
    this.adapter?.restoreIcons();
  }

  private restart() {
    this.disable();
    this.enable();
  }

  private async applyIconPack(iconPack: ThemePackId) {
    await this.themeProvider.setIconPack(iconPack);

    if (this.stopObserving) {
      this.restart();
    }
  }

  private applyIcon(entry: FileEntry) {
    if (!this.adapter) {
      return;
    }

    const icon = this.themeProvider.resolveIcon({
      filename: entry.path,
      type: entry.type,
      isOpen: entry.isOpen,
      isRoot: entry.isRoot,
    });

    if (!icon) {
      return;
    }

    this.adapter.replaceIcon(entry, icon.url);
  }
}

export default defineContentScript({
  matches: ['https://github.com/*'],
  main() {
    const orchestrator = new ContentOrchestrator();
    void orchestrator.start();
  },
});
