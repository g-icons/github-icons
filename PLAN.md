# Cross-Browser GitHub Material Icons Extension — Plan

## Goal

A browser extension (Chrome, Firefox, Safari) that replaces file/folder icons on GitHub with Material Design icons (like VS Code's material icon theme). Designed for future extensibility to GitLab and swappable icon themes.

---

## Investigation Findings

### Existing Extensions

**material-extensions/material-icons-browser-extension** — The dominant extension. Chrome/Firefox/Edge + 8 git hosting sites. No Safari. TypeScript + React 19 + MUI for popup (heavy). Uses `material-icon-theme` npm package directly. Provider pattern is implicit rather than formally typed. Uses `selector-observer` for DOM observation.

**AtomMaterialUI/a-file-icon-web** — Alternative using Atom Material Icons. Plasmo framework, React. Chrome/Firefox/Edge. Supports GitHub, GitLab, Bitbucket, Gitee, Azure DevOps.

Neither supports Safari. Our opportunity: Safari from day one, cleaner architecture, lighter weight.

### Material Icon Theme (PKief/vscode-material-icon-theme)

- npm package: `material-icon-theme`
- Icons: SVGs in `icons/` directory. Folder icons come in pairs (`folder-{name}.svg` / `folder-{name}-open.svg`)
- Exports `generateManifest()` API for building the full icon mapping
- Resolution priority: exact filename → file extension → pattern → default
- Supports icon packs (Angular, React, Vue, etc.) and custom associations

### GitHub DOM Structure

- GitHub uses **Turbo** for SPA navigation (no full page reloads)
- File rows found via selectors like `.react-directory-filename-column`, `.PRIVATE_TreeView-item-content`, `.js-navigation-item`
- Icons are Octicon SVGs: `.octicon-file`, `.octicon-file-directory-fill`, `.octicon-file-directory-open-fill`, `.octicon-file-submodule`, `.octicon-file-symlink-file`
- `MutationObserver` / `selector-observer` required to catch new rows after SPA navigation
- `PRIVATE_`-prefixed class names are internal and may change without notice

### Cross-Browser Compatibility

- MV3 works on all three targets (Chrome, Firefox, Safari)
- Safari requires an Xcode wrapper app via `xcrun safari-web-extension-converter`
- Safari distribution: Mac App Store ($99/yr Apple Developer account)
- No background script needed — content scripts only
- WXT framework handles cross-browser build from one codebase

---

## Architecture

### Framework: WXT (wxt.dev)

- Vite-based, file-based entrypoints
- Builds for Chrome, Firefox, Safari, Edge from one codebase
- TypeScript-first, framework-agnostic
- Built-in `browser` polyfill, storage utilities, SPA navigation events

### Layered Design

```
┌─────────────────────────────────────────┐
│         Layer 4: Settings UI            │  popup + options page (vanilla or Lit)
├─────────────────────────────────────────┤
│         Layer 3: Orchestrator           │  content script entrypoint
├──────────────────┬──────────────────────┤
│  Layer 2: Site   │  Layer 1: Icon       │
│  Adapters        │  Theme Engine        │
│  (GitHub, GitLab)│  (resolve + render)  │
└──────────────────┴──────────────────────┘
```

- **Icon Engine** (Layer 1): Pure logic, no DOM. Maps filename/folder → icon URL. Wraps `material-icon-theme`. Swappable via `ThemeProvider` interface.
- **Site Adapters** (Layer 2): One per hosting platform. Handles DOM selectors, file entry extraction, icon replacement, SPA observation. Implements `SiteAdapter` interface.
- **Orchestrator** (Layer 3): Content script entrypoint. Detects site, loads settings, wires adapter to engine.
- **Settings UI** (Layer 4): Lightweight popup/options. No React/MUI — vanilla or Lit.

### Project Structure

```
chrome-github-icons/
├── wxt.config.ts
├── package.json
├── tsconfig.json
├── entrypoints/
│   ├── content.ts              # Orchestrator (injected on matching sites)
│   ├── popup/
│   │   ├── index.html
│   │   └── main.ts
│   └── options/                # Future: full settings page
├── src/
│   ├── icon-engine/
│   │   ├── types.ts            # ThemeProvider interface
│   │   ├── resolver.ts         # filename/folder → icon URL (pure, no DOM)
│   │   ├── manifest-builder.ts # Wraps generateManifest() at build time
│   │   └── theme-registry.ts   # Register/switch between icon themes
│   ├── adapters/
│   │   ├── types.ts            # SiteAdapter + FileEntry interfaces
│   │   ├── registry.ts         # Adapter registry (detect & select)
│   │   ├── github/
│   │   │   ├── index.ts        # GitHub adapter implementation
│   │   │   ├── selectors.ts    # All CSS selectors, isolated for easy updates
│   │   │   └── detector.ts     # "Am I on GitHub?"
│   │   └── gitlab/             # Future
│   └── storage/
│       └── settings.ts         # Typed WXT storage items
├── public/
│   └── icons/                  # SVGs copied from material-icon-theme at build time
└── scripts/
    └── copy-icons.ts           # Build script to copy SVGs from node_modules
```

### Key Interfaces

```typescript
// Site Adapter — one per hosting platform
interface SiteAdapter {
  name: string;
  detect(): boolean;
  observeFileEntries(callback: (entries: FileEntry[]) => void): void;
  replaceIcon(entry: FileEntry, iconUrl: string): void;
}

interface FileEntry {
  element: Element;
  filename: string;
  type: 'file' | 'directory' | 'submodule' | 'symlink';
}

// Theme Provider — one per icon theme
interface ThemeProvider {
  name: string;
  resolveIcon(filename: string, type: FileEntry['type']): string;
  getAvailableIconPacks(): string[];
  setIconPack(pack: string): void;
}
```

### Dependencies (minimal)

| Package | Purpose |
|---------|---------|
| `wxt` | Extension framework + build |
| `material-icon-theme` | SVGs + `generateManifest()` |
| `selector-observer` | Reactive DOM observation |

No React, no MUI, no heavy UI framework.

### Icon Asset Strategy

Bundle SVGs from `material-icon-theme` into `public/icons/` at build time. Declare as `web_accessible_resources`. Reference via `browser.runtime.getURL('icons/typescript.svg')`. Pre-build the manifest JSON at compile time (not runtime) for performance.

---

## Implementation Phases

### Phase 1 — Core (MVP on Chrome)

1. Initialize WXT project, TypeScript, dependencies
2. Define `SiteAdapter`, `ThemeProvider`, `FileEntry` interfaces
3. Build icon engine wrapping `material-icon-theme` (build-time manifest generation)
4. Build GitHub adapter (all known selectors + `selector-observer`)
5. Orchestrator content script tying it together
6. Minimal popup (enable/disable toggle)
7. Test on Chrome

### Phase 2 — Cross-Browser

8. Firefox testing + fixes
9. Safari build pipeline (`wxt-module-safari-xcode`)
10. Safari testing + CSP handling (may need inline SVGs instead of `<img>`)

### Phase 3 — Extensibility

11. Theme registry + swappable themes (icon pack selector)
12. Per-site settings
13. GitLab adapter
14. Options page with custom file/folder mappings

---

## Known Risks

- **GitHub DOM instability**: Class names prefixed `PRIVATE_` can change without notice. Selectors isolated in `selectors.ts` for quick updates.
- **Safari CSP**: Strict CSP on some pages may block extension SVGs loaded as images. Fallback: inject inline `<svg>` elements.
- **Performance**: Large repos with hundreds of files. Pre-built manifest + efficient `selector-observer` keeps it fast.
- **Turbo navigation**: WXT's `wxt:locationchange` should handle most cases, but GitHub's specific behavior may need additional observation patterns.
