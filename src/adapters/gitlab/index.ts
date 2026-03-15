import { observe } from 'selector-observer';

import type { FileEntry, SiteAdapter } from '../types';
import { isGitLabLocation } from './detector';
import {
  extractEntryPath,
  extractFilename,
  findEntryContainer,
  findFilenameElement,
  findIconSvg,
  GITLAB_ICON_SELECTOR,
  getEntryTypeFromRow,
} from './selectors';

const ORIGINAL_ICON_ATTR = 'data-gmi-original';
const ORIGINAL_DISPLAY_ATTR = 'data-gmi-original-display';
const REPLACEMENT_ATTR = 'data-gmi-replacement';
const PROCESSED_ROW_ATTR = 'data-gmi-processed';

function readSvgClassName(element: SVGElement): string {
  return typeof element.className === 'string'
    ? element.className
    : element.className.baseVal;
}

function measureIconSize(iconElement: SVGElement): number {
  const rect = iconElement.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) {
    return Math.round(Math.max(rect.width, rect.height));
  }

  const width = Number.parseInt(iconElement.getAttribute('width') ?? '', 10);
  const height = Number.parseInt(iconElement.getAttribute('height') ?? '', 10);
  const fallback = Number.isFinite(width) && width > 0 ? width : height;

  return fallback || 16;
}

export class GitLabAdapter implements SiteAdapter {
  public readonly name = 'gitlab';

  private callback: ((entries: FileEntry[]) => void) | null = null;

  private mutationObserver: MutationObserver | null = null;

  detect(): boolean {
    return isGitLabLocation();
  }

  observeFileEntries(callback: (entries: FileEntry[]) => void): () => void {
    this.callback = callback;

    // Process any existing entries
    const entries = this.collectEntries();
    if (entries.length > 0) {
      callback(entries);
    }

    // Primary: selector-observer watches for SVG icons matching known patterns
    const selectorObs = observe(GITLAB_ICON_SELECTOR, {
      constructor: SVGElement,
      add: (iconElement) => {
        if (iconElement.hasAttribute(ORIGINAL_ICON_ATTR)) {
          return;
        }

        const entry = this.createEntry(iconElement);
        if (entry) {
          callback([entry]);
        }
      },
    });

    // Fallback: MutationObserver watches for new rows, then finds icons inside
    this.mutationObserver = new MutationObserver(() => {
      this.processUnhandledRows();
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Retry after a short delay in case Vue hasn't rendered the table yet
    setTimeout(() => this.processUnhandledRows(), 500);
    setTimeout(() => this.processUnhandledRows(), 2000);

    return () => {
      selectorObs.abort();
      this.mutationObserver?.disconnect();
      this.mutationObserver = null;
      this.callback = null;
    };
  }

  replaceIcon(entry: FileEntry, iconUrl: string) {
    const originalIcon = entry.iconElement;
    const existingReplacement = this.findReplacementImage(originalIcon);

    if (!originalIcon.hasAttribute(ORIGINAL_ICON_ATTR)) {
      originalIcon.setAttribute(ORIGINAL_ICON_ATTR, 'true');
      originalIcon.setAttribute(ORIGINAL_DISPLAY_ATTR, originalIcon.style.display);
    }

    originalIcon.style.display = 'none';

    if (existingReplacement) {
      existingReplacement.src = iconUrl;
      return;
    }

    const replacement = this.createReplacementImage(originalIcon, iconUrl);
    originalIcon.insertAdjacentElement('afterend', replacement);
  }

  restoreIcons() {
    document
      .querySelectorAll<HTMLImageElement>(`img[${REPLACEMENT_ATTR}="true"]`)
      .forEach((replacement) => replacement.remove());

    document
      .querySelectorAll<SVGElement>(`svg[${ORIGINAL_ICON_ATTR}="true"]`)
      .forEach((originalIcon) => {
        originalIcon.style.display =
          originalIcon.getAttribute(ORIGINAL_DISPLAY_ATTR) ?? '';
        originalIcon.removeAttribute(ORIGINAL_DISPLAY_ATTR);
        originalIcon.removeAttribute(ORIGINAL_ICON_ATTR);
      });

    document
      .querySelectorAll(`[${PROCESSED_ROW_ATTR}]`)
      .forEach((row) => row.removeAttribute(PROCESSED_ROW_ATTR));
  }

  private processUnhandledRows() {
    if (!this.callback) {
      return;
    }

    // Find all tree-item rows that haven't been processed yet
    const rowSelectors = 'tr.tree-item, table.tree-table tr, .tree-content-holder tr';
    const rows = document.querySelectorAll(rowSelectors);
    const entries: FileEntry[] = [];

    for (const row of rows) {
      if (row.hasAttribute(PROCESSED_ROW_ATTR)) {
        continue;
      }

      const iconElement = findIconSvg(row);
      if (!iconElement || iconElement.hasAttribute(ORIGINAL_ICON_ATTR)) {
        continue;
      }

      const entry = this.createEntry(iconElement);
      if (entry) {
        row.setAttribute(PROCESSED_ROW_ATTR, 'true');
        entries.push(entry);
      }
    }

    if (entries.length > 0) {
      this.callback(entries);
    }
  }

  private createEntry(iconElement: SVGElement): FileEntry | null {
    const container = findEntryContainer(iconElement);
    if (!container) {
      return null;
    }

    const filenameElement = findFilenameElement(container);
    if (!filenameElement) {
      return null;
    }

    const filename = extractFilename(filenameElement) ?? '';
    if (!filename) {
      return null;
    }

    const path = extractEntryPath(filenameElement, filename);
    const type = getEntryTypeFromRow(container);

    return {
      element: container,
      filename,
      path,
      type,
      iconElement,
      isOpen: false,
    };
  }

  private collectEntries(): FileEntry[] {
    // Try both selector-observer selectors and row-based discovery
    const svgEntries = Array.from(document.querySelectorAll<SVGElement>(GITLAB_ICON_SELECTOR))
      .map((iconElement) => this.createEntry(iconElement))
      .filter((entry): entry is FileEntry => entry !== null);

    if (svgEntries.length > 0) {
      return svgEntries;
    }

    // Fallback: find rows and look for SVGs inside
    const rows = document.querySelectorAll('tr.tree-item, table.tree-table tr, .tree-content-holder tr');
    const entries: FileEntry[] = [];

    for (const row of rows) {
      const iconElement = findIconSvg(row);
      if (!iconElement) {
        continue;
      }

      const entry = this.createEntry(iconElement);
      if (entry) {
        row.setAttribute(PROCESSED_ROW_ATTR, 'true');
        entries.push(entry);
      }
    }

    return entries;
  }

  private createReplacementImage(
    originalIcon: SVGElement,
    iconUrl: string,
  ): HTMLImageElement {
    const size = measureIconSize(originalIcon);
    const replacement = document.createElement('img');

    replacement.alt = '';
    replacement.ariaHidden = 'true';
    replacement.className = `gmi-icon ${readSvgClassName(originalIcon)}`.trim();
    replacement.decoding = 'async';
    replacement.draggable = false;
    replacement.height = size;
    replacement.referrerPolicy = 'no-referrer';
    replacement.src = iconUrl;
    replacement.width = size;

    replacement.setAttribute(REPLACEMENT_ATTR, 'true');
    replacement.style.display = 'inline-block';
    replacement.style.flexShrink = '0';
    replacement.style.height = `${size}px`;
    replacement.style.verticalAlign = 'text-bottom';
    replacement.style.width = `${size}px`;

    return replacement;
  }

  private findReplacementImage(
    originalIcon: SVGElement,
  ): HTMLImageElement | null {
    const nextSibling = originalIcon.nextElementSibling;

    return nextSibling instanceof HTMLImageElement &&
      nextSibling.getAttribute(REPLACEMENT_ATTR) === 'true'
      ? nextSibling
      : null;
  }
}
