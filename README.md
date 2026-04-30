# GitHub Icons

A browser extension that replaces GitHub's generic file and folder icons with distinct, colorful glyphs — so your repo tree is readable at a glance.

Learn more at [githubicons.com](https://githubicons.com/).

## Icon Themes

Choose from nine icon themes in the extension popup:

| Theme | Icons | Source |
|-------|-------|--------|
| **Material Icon Theme** | 1,200+ | [material-icon-theme](https://github.com/PKief/vscode-material-icon-theme) |
| **VSCode Icons** | 930+ | [vscode-icons](https://github.com/vscode-icons/vscode-icons) |
| **Seti UI** | 150+ | [seti-ui](https://github.com/jesseweed/seti-ui) |
| **Symbols** | 240+ | [vscode-symbols](https://github.com/misolori/vscode-symbols) |
| **Catppuccin** | 650+ | [catppuccin/vscode-icons](https://github.com/catppuccin/vscode-icons) |
| **Great Icons** | 290+ | [vscode-great-icons](https://github.com/EmmanuelBeziat/vscode-great-icons) |
| **Mizu Icons** | 700+ | [cdfzo/mizu](https://codeberg.org/cdfzo/mizu) |
| **Icons - Maintained** | 750+ | [yusifaliyevpro/vscode-icons](https://github.com/yusifaliyevpro/vscode-icons) |
| **JetBrains** | 90+ | [ardonplay/vscode-jetbrains-icon-theme](https://github.com/ardonplay/vscode-jetbrains-icon-theme) |

## Install

[**Chrome Web Store**](https://chromewebstore.google.com/detail/github-icons/hjhebcpkgfacibbiohdccepipeekkjlj)

Safari and Firefox versions should be available soon!

Or build and load it locally:

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
