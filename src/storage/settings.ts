import { storage } from 'wxt/utils/storage';

import type { ThemePackId } from '../icon-engine/types';

export interface ExtensionSettings {
  enabled: boolean;
  iconPack: ThemePackId;
}

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
  const [enabled, iconPack] = await Promise.all([
    extensionEnabled.getValue(),
    activeIconPack.getValue(),
  ]);

  return {
    enabled,
    iconPack,
  };
}
