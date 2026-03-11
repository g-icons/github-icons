import type { FileEntryType } from '../icon-engine/types';

export interface FileEntry {
  element: Element;
  filename: string;
  type: FileEntryType;
  iconElement: SVGElement;
  isOpen?: boolean;
  isRoot?: boolean;
}

export interface SiteAdapter {
  name: string;
  detect(): boolean;
  observeFileEntries(callback: (entries: FileEntry[]) => void): () => void;
  replaceIcon(entry: FileEntry, iconUrl: string): void;
  restoreIcons(): void;
}
