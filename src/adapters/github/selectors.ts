import type { FileEntryType } from '../../icon-engine/types';

const COMPACT_PATH_TITLE = 'This path skips through empty directories';
const EMBEDDED_DATA_SELECTOR = 'script[data-target="react-app.embeddedData"]';
const EMPTY_EMBEDDED_DATA = {
  currentPath: null,
  refName: null,
} as const;

let cachedEmbeddedDataText: string | null = null;
let cachedEmbeddedData: {
  currentPath: string | null;
  refName: string | null;
} = EMPTY_EMBEDDED_DATA;

const GITHUB_NAME_SELECTOR_LIST = [
  '[data-testid="tree-view-item-name"]',
  '[aria-label$=", (Directory)"]',
  '[aria-label$=", (File)"]',
  '.react-directory-filename-column a',
  'a[data-testid="view-all-files-file-link"]',
  '.react-directory-filename-cell a',
  'a.js-navigation-open',
  'a.Link--primary',
  '[title]',
] as const;

export const GITHUB_ICON_SELECTOR = 'svg[class*="octicon-file"]';

const GITHUB_ENTRY_CONTAINER_SELECTOR = [
  '.react-directory-row',
  '[role="treeitem"]',
  '[data-testid="tree-view-item"]',
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

    if (extractFilename(match) || readPathFromLink(match)) {
      return match;
    }
  }

  return null;
}

export function extractFilename(element: Element): string | null {
  const ariaLabel = element.getAttribute('aria-label')?.trim();
  if (ariaLabel) {
    const suffixIndex = ariaLabel.lastIndexOf(', (');
    const filename =
      suffixIndex >= 0 ? ariaLabel.slice(0, suffixIndex) : ariaLabel;

    if (filename.trim()) {
      return filename.trim();
    }
  }

  const title = element.getAttribute('title')?.trim();
  if (title && title !== COMPACT_PATH_TITLE) {
    return title;
  }

  const text = element.textContent?.replace(/\s+/g, ' ').trim();
  return text || null;
}

function readEmbeddedData(): {
  currentPath: string | null;
  refName: string | null;
} {
  const embeddedData = document.querySelector<HTMLScriptElement>(
    EMBEDDED_DATA_SELECTOR,
  )?.textContent;

  if (embeddedData === cachedEmbeddedDataText) {
    return cachedEmbeddedData;
  }

  cachedEmbeddedDataText = embeddedData ?? null;

  if (!embeddedData) {
    cachedEmbeddedData = EMPTY_EMBEDDED_DATA;
    return cachedEmbeddedData;
  }

  try {
    const parsed = JSON.parse(embeddedData) as {
      payload?: {
        codeViewTreeRoute?: {
          path?: string;
          refInfo?: {
            name?: string;
          };
        };
        codeViewLayoutRoute?: {
          path?: string;
          refInfo?: {
            name?: string;
          };
        };
      };
    };

    cachedEmbeddedData = {
      currentPath:
        parsed.payload?.codeViewTreeRoute?.path ??
        parsed.payload?.codeViewLayoutRoute?.path ??
        null,
      refName:
        parsed.payload?.codeViewTreeRoute?.refInfo?.name ??
        parsed.payload?.codeViewLayoutRoute?.refInfo?.name ??
        null,
    };
    return cachedEmbeddedData;
  } catch {
    cachedEmbeddedData = EMPTY_EMBEDDED_DATA;
    return cachedEmbeddedData;
  }
}

function normalizeRepoPath(value: string | null | undefined): string {
  if (!value || value === '/') {
    return '';
  }

  return value.replace(/^\/+|\/+$/g, '');
}

function readPathFromLink(
  element: Element,
  refName: string | null = readEmbeddedData().refName,
): string | null {
  const link =
    element instanceof HTMLAnchorElement
      ? element
      : element.closest<HTMLAnchorElement>('a[href]');

  if (!link) {
    return null;
  }

  if (!refName) {
    return null;
  }

  try {
    const url = new URL(link.href, window.location.origin);
    const segments = url.pathname.split('/').filter(Boolean);
    const routeIndex = segments.findIndex(
      (segment) => segment === 'blob' || segment === 'tree',
    );

    if (routeIndex < 0) {
      return null;
    }

    const remainingSegments = segments.slice(routeIndex + 1);
    const refSegments = refName.split('/').filter(Boolean);

    if (
      refSegments.length === 0 ||
      remainingSegments.length < refSegments.length ||
      refSegments.some((segment, index) => remainingSegments[index] !== segment)
    ) {
      return null;
    }

    return normalizeRepoPath(
      decodeURIComponent(remainingSegments.slice(refSegments.length).join('/')),
    );
  } catch {
    return null;
  }
}

export function extractEntryPath(element: Element, filename: string): string {
  const embeddedData = readEmbeddedData();
  const linkedPath = readPathFromLink(element, embeddedData.refName);
  if (linkedPath) {
    return linkedPath;
  }

  const normalizedName = filename.trim();
  if (!normalizedName) {
    return normalizedName;
  }

  if (normalizedName.includes('/')) {
    return normalizedName;
  }

  const currentPath = normalizeRepoPath(embeddedData.currentPath);
  if (!currentPath) {
    return normalizedName;
  }

  return `${currentPath}/${normalizedName}`;
}
