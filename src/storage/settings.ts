import { storage } from 'wxt/utils/storage';

import type { ThemePackId } from '../icon-engine/types';

export interface ExtensionSettings {
  enabledGithub: boolean;
  enabledGitlab: boolean;
  iconPack: ThemePackId;
}

export const enabledGithub = storage.defineItem<boolean>(
  'local:enabled-github',
  {
    fallback: true,
  },
);

export const enabledGitlab = storage.defineItem<boolean>(
  'local:enabled-gitlab',
  {
    fallback: true,
  },
);

// Keep legacy key working for backwards compat — read-only migration
export const extensionEnabled = storage.defineItem<boolean>(
  'local:extension-enabled',
  {
    fallback: true,
  },
);

export const activeIconPack = storage.defineItem<ThemePackId>(
  'local:active-icon-pack',
  {
    fallback: 'default',
  },
);

export async function getExtensionSettings(): Promise<ExtensionSettings> {
  const [github, gitlab, iconPack] = await Promise.all([
    enabledGithub.getValue(),
    enabledGitlab.getValue(),
    activeIconPack.getValue(),
  ]);

  return {
    enabledGithub: github,
    enabledGitlab: gitlab,
    iconPack,
  };
}
