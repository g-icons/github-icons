import type { IconPackValue } from 'material-icon-theme';

export type FileEntryType = 'file' | 'directory' | 'submodule' | 'symlink';

export type ThemePackId = 'default' | Exclude<IconPackValue, ''>;

export interface IconQuery {
  filename: string;
  type: FileEntryType;
  isOpen?: boolean;
  isRoot?: boolean;
}

export interface ResolvedIcon {
  iconId: string;
  iconPath: string;
  url: string;
}

export interface ThemeProvider {
  name: string;
  resolveIcon(query: IconQuery): ResolvedIcon | null;
  getAvailableIconPacks(): readonly ThemePackId[];
  getActiveIconPack(): ThemePackId;
  setIconPack(pack: ThemePackId): void;
}
