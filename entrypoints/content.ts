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

  private readonly lightModeQuery = window.matchMedia(
    '(prefers-color-scheme: light)',
  );

  private stopObserving: (() => void) | null = null;

  private themeObserver: MutationObserver | null = null;

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

    this.observeThemeChanges();
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
      preferLight: this.isLightTheme(),
    });

    if (!icon) {
      return;
    }

    this.adapter.replaceIcon(entry, icon.url);
  }

  private isLightTheme(): boolean {
    const colorMode = document.documentElement.getAttribute('data-color-mode');

    if (colorMode === 'light') {
      return true;
    }

    if (colorMode === 'dark') {
      return false;
    }

    return this.lightModeQuery.matches;
  }

  private observeThemeChanges() {
    const handleThemeChange = () => {
      if (!this.stopObserving) {
        return;
      }

      this.restart();
    };

    this.themeObserver = new MutationObserver((mutations) => {
      if (
        mutations.some(
          (mutation) =>
            mutation.type === 'attributes' &&
            mutation.target === document.documentElement,
        )
      ) {
        handleThemeChange();
      }
    });

    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-color-mode', 'data-light-theme', 'data-dark-theme'],
    });

    if (typeof this.lightModeQuery.addEventListener === 'function') {
      this.lightModeQuery.addEventListener('change', handleThemeChange);
      return;
    }

    (this.lightModeQuery as MediaQueryList & {
      addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
    }).addListener?.(handleThemeChange);
  }
}

export default defineContentScript({
  matches: ['https://github.com/*'],
  main() {
    const orchestrator = new ContentOrchestrator();
    void orchestrator.start();
  },
});
