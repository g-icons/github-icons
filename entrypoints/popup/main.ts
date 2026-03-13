import './style.css';

import { activeIconPack, extensionEnabled } from '../../src/storage/settings';
import type { ThemePackId } from '../../src/icon-engine/types';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Popup root element not found.');
}

const MATERIAL_PACKS: ThemePackId[] = [
  'default', 'angular', 'nest', 'angular_ngrx', 'react',
  'react_redux', 'roblox', 'qwik', 'vue', 'vue_vuex', 'bashly',
];

const ALL_PACKS: { id: ThemePackId; label: string; group: string }[] = [
  ...MATERIAL_PACKS.map((id) => ({ id, label: formatPackLabel(id), group: 'Material Icon Theme' })),
  { id: 'vscode-icons', label: 'VSCode Icons', group: 'VSCode Icons' },
];

function formatPackLabel(pack: string): string {
  return pack === 'default'
    ? 'Default'
    : pack
        .split('_')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
}

app.innerHTML = `
  <main class="popup-shell">
    <p class="eyebrow">GitHub Material Icons</p>
    <h1>Replace GitHub file icons with Material Design icons.</h1>
    <label class="toggle-card" for="enabled">
      <div>
        <span class="toggle-label">Enable on GitHub</span>
        <p class="toggle-copy" id="status-copy"></p>
      </div>
      <input id="enabled" type="checkbox" role="switch" />
    </label>
    <dl class="meta-list">
      <div>
        <dt>Icon Pack</dt>
        <dd>
          <select id="pack-select"></select>
        </dd>
      </div>
    </dl>
  </main>
`;

const enabledToggle = document.querySelector<HTMLInputElement>('#enabled')!;
const statusCopy = document.querySelector<HTMLParagraphElement>('#status-copy')!;
const packSelect = document.querySelector<HTMLSelectElement>('#pack-select')!;

let currentGroup = '';
for (const pack of ALL_PACKS) {
  if (pack.group !== currentGroup) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = pack.group;
    packSelect.appendChild(optgroup);
    currentGroup = pack.group;
  }
  const option = document.createElement('option');
  option.value = pack.id;
  option.textContent = pack.label;
  packSelect.lastElementChild!.appendChild(option);
}

function renderStatus(enabled: boolean) {
  enabledToggle.checked = enabled;
  statusCopy.textContent = enabled
    ? 'Icons are active on github.com.'
    : 'GitHub keeps its native icons until you turn this back on.';
}

async function bootstrap() {
  const [enabled, pack] = await Promise.all([
    extensionEnabled.getValue(),
    activeIconPack.getValue(),
  ]);

  renderStatus(enabled);
  packSelect.value = pack;
}

enabledToggle.addEventListener('change', async () => {
  enabledToggle.disabled = true;
  await extensionEnabled.setValue(enabledToggle.checked);
  renderStatus(enabledToggle.checked);
  enabledToggle.disabled = false;
});

packSelect.addEventListener('change', async () => {
  packSelect.disabled = true;
  await activeIconPack.setValue(packSelect.value as ThemePackId);
  packSelect.disabled = false;
});

extensionEnabled.watch((enabled) => renderStatus(enabled));
activeIconPack.watch((pack) => {
  packSelect.value = pack;
});

void bootstrap();
