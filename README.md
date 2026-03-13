# GitHub Icons

A browser extension that replaces GitHub's generic file and folder icons with distinct, colorful glyphs — so your repo tree is readable at a glance.

## Icon Themes

Choose from four icon themes in the extension popup:

| Theme | Icons | Source |
|-------|-------|--------|
| **Material Icon Theme** | 1,200+ | [material-icon-theme](https://github.com/PKief/vscode-material-icon-theme) |
| **VSCode Icons** | 930+ | [vscode-icons](https://github.com/vscode-icons/vscode-icons) |
| **Seti UI** | 150+ | [seti-ui](https://github.com/jesseweed/seti-ui) |
| **Symbols** | 240+ | [vscode-symbols](https://github.com/misolori/vscode-symbols) |

## Install

The extension is currently under review by the Chrome Web Store. In the meantime, build and load it locally:

```bash
git clone https://github.com/g-icons/github-icons
cd github-icons
npm install
npm run build
```

Then open `chrome://extensions`, enable Developer mode, and load `output/chrome-mv3` as an unpacked extension.

## Development

```bash
npm install
npm run dev          # dev server with hot reload
npm run build        # production build
npm run compile      # type check
npm run chrome       # build + zip for Chrome Web Store
```
