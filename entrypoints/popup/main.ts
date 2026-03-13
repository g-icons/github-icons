import './style.css';

import { allThemePacks } from '../../src/generated/theme-packs';
import { activeIconPack, extensionEnabled } from '../../src/storage/settings';
import type { ThemePackId } from '../../src/icon-engine/types';

const PACK_LABELS: Partial<Record<ThemePackId, string>> = {
  default: 'Material Icon Theme',
  angular: 'Material Icon Theme: Angular',
  nest: 'Material Icon Theme: Nest',
  angular_ngrx: 'Material Icon Theme: Angular NgRx',
  react: 'Material Icon Theme: React',
  react_redux: 'Material Icon Theme: React Redux',
  roblox: 'Material Icon Theme: Roblox',
  qwik: 'Material Icon Theme: Qwik',
  vue: 'Material Icon Theme: Vue',
  vue_vuex: 'Material Icon Theme: Vue Vuex',
  bashly: 'Material Icon Theme: Bashly',
  'vscode-icons': 'VSCode Icons',
  seti: 'Seti UI',
};

function formatPackLabel(pack: ThemePackId): string {
  return PACK_LABELS[pack] ?? pack;
}

const themeOptions = allThemePacks.map((pack) => `<option value="${pack}">${formatPackLabel(pack)}</option>`).join('');

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Popup root element not found.');
}

app.innerHTML = `
  <main class="popup-shell">
    <p class="eyebrow">GitHub Icons</p>
    <dl class="meta-list">
      <div>
        <dabled" type="checkbox" /><span class="toggle-track"></span></label></dd>
      </div>
      <div>
        <dt>Theme</dt>
        <dd>
          <select id="theme-select">
            ${themeOptions}
          </select>
        </dd>
      </div>
    </dl>
  </main>
`;

const enabledToggle = document.querySelector<HTMLInputElement>('#enabled')!;
const themeSelect = document.querySelector<HTMLSelectElement>('#theme-select')!;

function renderPack(pack: ThemePackId) {
  themeSelect.value = pack;
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
  themeSelect.disabled = true;
  await activeIconPack.setValue(themeSelect.value as ThemePackId);
  themeSelect.disabled = false;
});

extensionEnabled.watch((enabled) => { enabledToggle.checked = enabled; });
activeIconPack.watch((pack) => renderPack(pack));

void bootstrap();
