import type { FileEntryType } from '../../icon-engine/types';

// GitLab file tree structure (from row.vue + file_icon.vue):
//   <tr class="tree-item">
//     <th class="tree-item-file-name">
//       <a class="tree-item-link">
//         <span>  ← file-icon component wrapper
//           <svg ...>  ← the icon (file-icon or gl-icon)
//         </span>
//         <span>filename</span>
//       </a>
//     </th>
//   </tr>
//
// Multiple selectors for resilience against GitLab UI changes:
export const GITLAB_ICON_SELECTOR = [
  'tr.tree-item svg.file-icon',
  'tr.tree-item .tree-item-link svg.gl-icon',
  'table.tree-table tr svg.file-icon',
  'table.tree-table tr .tree-item-link svg',
  '.tree-content-holder tr svg.file-icon',
  '.tree-content-holder tr svg.gl-icon',
].join(', ');

const GITLAB_ENTRY_CONTAINER_SELECTOR = 'tr.tree-item, table.tree-table tr, .tree-content-holder tr';

const GITLAB_NAME_SELECTOR_LIST = [
  '[data-qa-file-name]',
  '[data-testid="truncate-end-container"]',
  '[data-testid="file-row-name-container"]',
  'a.tree-item-link',
  '[data-testid="file-name-link"]',
  '.tree-item-file-name a',
  'th a',
  'td:first-child a',
  'td a',
] as const;

function normalizePath(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, '');
}

function splitPathSegments(value: string): string[] {
  return normalizePath(value).split('/').filter(Boolean);
}

function readFilenameAttribute(element: Element): string | null {
  for (const attribute of ['data-qa-file-name', 'aria-label', 'title']) {
    const value = element.getAttribute(attribute)?.trim();
    if (value) {
      return value;
    }
  }

  return null;
}

function expandCompactPath(path: string, filename: string): string {
  const normalizedPath = normalizePath(path);
  const normalizedFilename = normalizePath(filename);

  if (!normalizedFilename.includes('/')) {
    return normalizedPath || normalizedFilename;
  }

  if (!normalizedPath) {
    return normalizedFilename;
  }

  if (normalizedFilename === normalizedPath || normalizedFilename.startsWith(`${normalizedPath}/`)) {
    return normalizedFilename;
  }

  const pathSegments = splitPathSegments(normalizedPath);
  const filenameSegments = splitPathSegments(normalizedFilename);

  if (pathSegments.at(-1) === filenameSegments[0]) {
    return [...pathSegments, ...filenameSegments.slice(1)].join('/');
  }

  return normalizedPath;
}

export function getEntryTypeFromRow(container: Element): FileEntryType {
  // Check for folder via gl-icon sprite reference
  const glIconUse = container.querySelector('svg.gl-icon use');
  if (glIconUse) {
    const href = glIconUse.getAttribute('href') ?? glIconUse.getAttribute('xlink:href') ?? '';
    if (href.includes('#folder')) {
      return 'directory';
    }
  }

  // Submodules have is-submodule class on the link element
  if (container.querySelector('.is-submodule')) {
    return 'submodule';
  }

  // Check the link href as fallback
  const link = container.querySelector<HTMLAnchorElement>('a[href]');
  if (link) {
    const href = link.getAttribute('href') ?? '';
    if (href.includes('/-/tree/')) {
      return 'directory';
    }

    if (href.includes('/-/commit/')) {
      return 'submodule';
    }
  }

  return 'file';
}

export function findEntryContainer(element: Element): Element | null {
  return element.closest(GITLAB_ENTRY_CONTAINER_SELECTOR);
}

export function findFilenameElement(container: Element): Element | null {
  for (const selector of GITLAB_NAME_SELECTOR_LIST) {
    const match = container.querySelector(selector);
    if (match) {
      return match;
    }
  }

  return null;
}

export function extractFilename(element: Element): string | null {
  const directValue = readFilenameAttribute(element);
  if (directValue) {
    return directValue;
  }

  const nestedValue = element.querySelector<HTMLElement>(
    '[data-qa-file-name], [data-testid="truncate-end-container"], [title]',
  );
  if (nestedValue) {
    const nestedAttributeValue = readFilenameAttribute(nestedValue);
    if (nestedAttributeValue) {
      return nestedAttributeValue;
    }
  }

  const text = element.textContent?.replace(/\s+/g, ' ').trim();
  return text || null;
}

export function extractEntryPath(element: Element, filename: string): string {
  const link =
    element instanceof HTMLAnchorElement
      ? element
      : element.closest<HTMLAnchorElement>('a[href]');

  if (link) {
    const href = link.getAttribute('href') ?? '';
    // GitLab URLs: /group/project/-/tree/branch/path or /-/blob/branch/path
    const match = href.match(/\/-\/(?:tree|blob)\/[^/]+\/(.+)/);
    if (match) {
      try {
        return expandCompactPath(decodeURIComponent(match[1]), filename);
      } catch {
        return expandCompactPath(match[1], filename);
      }
    }
  }

  return normalizePath(filename);
}

export function findIconSvg(container: Element): SVGElement | null {
  // Try specific selectors first, then fall back to any SVG in the name link
  const selectors = [
    'svg.file-icon',
    'svg.gl-icon',
    '.tree-item-link svg',
    '.tree-item-file-name svg',
    'th svg',
    'td:first-child svg',
  ];

  for (const selector of selectors) {
    const match = container.querySelector<SVGElement>(selector);
    if (match) {
      return match;
    }
  }

  return null;
}
