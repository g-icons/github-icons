import { observe } from 'selector-observer';

import type { FileEntry, SiteAdapter } from '../types';
import { isGitHubLocation } from './detector';
import {
  extractEntryPath,
  extractFilename,
  findEntryContainer,
  findFilenameElement,
  GITHUB_ICON_SELECTOR,
  getEntryTypeFromIcon,
  isOpenFolderIcon,
} from './selectors';

const ORIGINAL_ICON_ATTR = 'data-gmi-original';
const ORIGINAL_DISPLAY_ATTR = 'data-gmi-original-display';
const REPLACEMENT_ATTR = 'data-gmi-replacement';

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

export class GitHubAdapter implements SiteAdapter {
  public readonly name = 'github';

  detect(): boolean {
    return isGitHubLocation();
  }

  observeFileEntries(callback: (entries: FileEntry[]) => void): () => void {
    const entries = this.collectEntries();
    if (entries.length > 0) {
      callback(entries);
    }

    const observer = observe(GITHUB_ICON_SELECTOR, {
      constructor: SVGElement,
      add: (iconElement) => {
        const entry = this.createEntry(iconElement);
        if (entry) {
          callback([entry]);
        }
      },
    });

    return () => observer.abort();
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

    // Remove orphaned replacement images in the same parent.
    // In the sidebar, React swaps between closed/open folder SVGs — the old
    // SVG is removed but our <img> replacement stays behind.
    const parent = originalIcon.parentElement;
    if (parent) {
      parent.querySelectorAll<HTMLImageElement>(`img[${REPLACEMENT_ATTR}="true"]`)
        .forEach((orphan) => orphan.remove());
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
    const path = extractEntryPath(filenameElement, filename);
    const resolvedFilename =
      filename ||
      path.split('/').filter(Boolean).at(-1) ||
      path;

    if (!resolvedFilename || !path) {
      return null;
    }

    return {
      element: container,
      filename: resolvedFilename,
      path,
      type: getEntryTypeFromIcon(iconElement),
      iconElement,
      isOpen: isOpenFolderIcon(iconElement),
    };
  }

  private collectEntries(): FileEntry[] {
    return Array.from(document.querySelectorAll<SVGElement>(GITHUB_ICON_SELECTOR))
      .map((iconElement) => this.createEntry(iconElement))
      .filter((entry): entry is FileEntry => entry !== null);
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
