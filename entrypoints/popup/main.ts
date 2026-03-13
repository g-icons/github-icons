import './style.css';

import { activeIconPack, extensionEnabled } from '../../src/storage/settings';
import type { MaterialPackId, ThemeId, ThemePackId } from '../../src/icon-engine/types';

const TOP_LEVEL_THEMES: { value: ThemeId; label: string }[] = [
  { value: 'material', label: 'Material Icon Theme' },
  { value: 'vscode-icons', label: 'VSCode Icons' },
  { value: 'seti', label: 'Seti UI' },
  { value: 'symbols', label: 'Symbols' },
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

const STANDALONE_THEMES: Set<string> = new Set(['vscode-icons', 'seti', 'symbols']);

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
    <p class="eyebrow">GitHub Icons</p>
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
