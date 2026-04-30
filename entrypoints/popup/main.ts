import './style.css';

import { activeIconPack, extensionEnabled } from '../../src/storage/settings';
import type { MaterialPackId, ThemeId, ThemePackId } from '../../src/icon-engine/types';

const TOP_LEVEL_THEMES: { value: ThemeId; label: string }[] = [
  { value: 'material', label: 'Material Icon Theme' },
  { value: 'vscode-icons', label: 'VSCode Icons' },
  { value: 'seti', label: 'Seti UI' },
  { value: 'symbols', label: 'Symbols' },
  { value: 'catppuccin', label: 'Catppuccin' },
  { value: 'great-icons', label: 'Great Icons' },
  { value: 'mizu', label: 'Mizu Icons' },
  { value: 'icons-maintained', label: 'Icons - Maintained' },
  { value: 'jetbrains', label: 'JetBrains' },
];

const MATERIAL_SUB_PACKS: { value: MaterialPackId; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'angular', label: 'Angular' },
  { value: 'nest', label: 'Nest' },
  { value: 'angular_ngrx', label: 'Angular NgRx' },
  { value: 'react', label: 'React' },
  { value: 'react_redux', label: 'React Redux' },
  { value: 'roblox', label: 'Roblox' },
  { value: 'qwik', label: 'Qwik' },
  { value: 'vue', label: 'Vue' },
  { value: 'vue_vuex', label: 'Vue Vuex' },
  { value: 'bashly', label: 'Bashly' },
];

const STANDALONE_THEMES: Set<string> = new Set([
  'vscode-icons',
  'seti',
  'symbols',
  'catppuccin',
  'great-icons',
  'mizu',
  'icons-maintained',
  'jetbrains',
]);

function packToTheme(pack: ThemePackId): ThemeId {
  if (STANDALONE_THEMES.has(pack)) return pack as ThemeId;
  return 'material';
}

const themeOptions = TOP_LEVEL_THEMES.map((t) => `<option value="${t.value}">${t.label}</option>`).join('');
const subPackOptions = MATERIAL_SUB_PACKS.map((p) => `<option value="${p.value}">${p.label}</option>`).join('');

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Popup root element not found.');
}

app.innerHTML = `
  <main class="popup-shell">
    <div class="popup-header">
      <p class="eyebrow">GitHub Icons</p>
      <a href="https://github.com/g-icons/github-icons" target="_blank" rel="noopener" class="github-link" title="View on GitHub">
        <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
        </svg>
      </a>
    </div>
    <dl class="meta-list">
      <div>
        <dt>Enable on GitHub</dt>
        <dd><label class="toggle" for="enabled"><input id="enabled" type="checkbox" /><span class="toggle-track"></span></label></dd>
      </div>
      <div>
        <dt>Theme</dt>
        <dd>
          <select id="theme-select">
            ${themeOptions}
          </select>
        </dd>
      </div>
      <div id="sub-pack-row" class="hidden">
        <dt>Variant</dt>
        <dd>
          <select id="sub-pack-select">
            ${subPackOptions}
          </select>
        </dd>
      </div>
    </dl>
  </main>
`;

const enabledToggle = document.querySelector<HTMLInputElement>('#enabled')!;
const themeSelect = document.querySelector<HTMLSelectElement>('#theme-select')!;
const subPackSelect = document.querySelector<HTMLSelectElement>('#sub-pack-select')!;
const subPackRow = document.querySelector<HTMLDivElement>('#sub-pack-row')!;

function updateSubPackVisibility(theme: ThemeId) {
  subPackRow.classList.toggle('hidden', theme !== 'material');
}

function renderPack(pack: ThemePackId) {
  const theme = packToTheme(pack);
  themeSelect.value = theme;
  if (theme === 'material') {
    subPackSelect.value = pack;
  }
  updateSubPackVisibility(theme);
}

async function bootstrap() {
  const [enabled, pack] = await Promise.all([extensionEnabled.getValue(), activeIconPack.getValue()]);

  enabledToggle.checked = enabled;
  renderPack(pack);
}

enabledToggle.addEventListener('change', async () => {
  enabledToggle.disabled = true;
  await extensionEnabled.setValue(enabledToggle.checked);
  enabledToggle.disabled = false;
});

themeSelect.addEventListener('change', async () => {
  const theme = themeSelect.value as ThemeId;
  updateSubPackVisibility(theme);
  const pack: ThemePackId = theme === 'material' ? subPackSelect.value as MaterialPackId : theme;
  themeSelect.disabled = true;
  await activeIconPack.setValue(pack);
  themeSelect.disabled = false;
});

subPackSelect.addEventListener('change', async () => {
  subPackSelect.disabled = true;
  await activeIconPack.setValue(subPackSelect.value as ThemePackId);
  subPackSelect.disabled = false;
});

extensionEnabled.watch((enabled) => { enabledToggle.checked = enabled; });
activeIconPack.watch((pack) => renderPack(pack));

void bootstrap();
