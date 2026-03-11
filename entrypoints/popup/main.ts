import './style.css';

import { activeIconPack, extensionEnabled } from '../../src/storage/settings';

const app = document.querySelector<HTMLDivElement>('#app');

if (!app) {
  throw new Error('Popup root element not found.');
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
        <dt>Theme</dt>
        <dd>Material Icon Theme</dd>
      </div>
      <div>
        <dt>Pack</dt>
        <dd id="pack-name"></dd>
      </div>
    </dl>
  </main>
`;

const enabledToggle = document.querySelector<HTMLInputElement>('#enabled')!;
const statusCopy = document.querySelector<HTMLParagraphElement>('#status-copy')!;
const packName = document.querySelector<HTMLElement>('#pack-name')!;

function formatPackLabel(pack: string): string {
  return pack === 'default'
    ? 'Default'
    : pack
        .split('_')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
}

function renderStatus(enabled: boolean) {
  enabledToggle.checked = enabled;
  statusCopy.textContent = enabled
    ? 'Material icons are active on github.com.'
    : 'GitHub keeps its native icons until you turn this back on.';
}

async function bootstrap() {
  const [enabled, pack] = await Promise.all([
    extensionEnabled.getValue(),
    activeIconPack.getValue(),
  ]);

  renderStatus(enabled);
  packName.textContent = formatPackLabel(pack);
}

enabledToggle.addEventListener('change', async () => {
  enabledToggle.disabled = true;
  await extensionEnabled.setValue(enabledToggle.checked);
  renderStatus(enabledToggle.checked);
  enabledToggle.disabled = false;
});

extensionEnabled.watch((enabled) => renderStatus(enabled));
activeIconPack.watch((pack) => {
  packName.textContent = formatPackLabel(pack);
});

void bootstrap();
