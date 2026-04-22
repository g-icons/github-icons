import type { IconPackValue } from 'material-icon-theme';

export type FileEntryType = 'file' | 'directory' | 'submodule' | 'symlink';

export type ThemeId =
  | 'material'
  | 'vscode-icons'
  | 'seti'
  | 'symbols'
  | 'catppuccin'
  | 'great-icons'
  | 'mizu';

export type MaterialPackId = 'default' | Exclude<IconPackValue, ''>;

export type ThemePackId =
  | MaterialPackId
  | 'vscode-icons'
  | 'seti'
  | 'symbols'
  | 'catppuccin'
  | 'great-icons'
  | 'mizu';

export interface IconQuery {
  filename: string;
  type: FileEntryType;
  isOpen?: boolean;
  isRoot?: boolean;
  preferLight?: boolean;
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
  setIconPack(pack: ThemePackId): Promise<void>;
}
