import type { FileEntryType } from '../../icon-engine/types';

const GITHUB_NAME_SELECTOR_LIST = [
  '.react-directory-filename-column a',
  'a[data-testid="view-all-files-file-link"]',
  '[data-testid="tree-view-item-name"]',
  'a.js-navigation-open',
  'a.Link--primary',
  'a[title]',
] as const;

export const GITHUB_ICON_SELECTOR = [
  'svg.octicon-file',
  'svg.octicon-file-directory-fill',
  'svg.octicon-file-directory-open-fill',
  'svg.octicon-file-submodule',
  'svg.octicon-file-symlink-file',
].join(', ');

const GITHUB_ENTRY_CONTAINER_SELECTOR = [
  '.react-directory-row',
  '.PRIVATE_TreeView-item-content',
  'tr.js-navigation-item',
  'li.js-navigation-item',
  'div[role="row"]',
].join(', ');

export function getEntryTypeFromIcon(iconElement: SVGElement): FileEntryType {
  if (
    iconElement.classList.contains('octicon-file-directory-fill') ||
    iconElement.classList.contains('octicon-file-directory-open-fill')
  ) {
    return 'directory';
  }

  if (iconElement.classList.contains('octicon-file-submodule')) {
    return 'submodule';
  }

  if (iconElement.classList.contains('octicon-file-symlink-file')) {
    return 'symlink';
  }

  return 'file';
}

export function isOpenFolderIcon(iconElement: SVGElement): boolean {
  return iconElement.classList.contains('octicon-file-directory-open-fill');
}

export function findEntryContainer(element: Element): Element | null {
  return element.closest(GITHUB_ENTRY_CONTAINER_SELECTOR);
}

export function findFilenameElement(container: Element): Element | null {
  for (const selector of GITHUB_NAME_SELECTOR_LIST) {
    const match = container.querySelector(selector);
    if (!match) {
      continue;
    }

    const text = extractFilename(match);
    if (text) {
      return match;
    }
  }

  return null;
}

export function extractFilename(element: Element): string | null {
  const title = element.getAttribute('title')?.trim();
  if (title) {
    return title;
  }

  const text = element.textContent?.replace(/\s+/g, ' ').trim();
  return text || null;
}
