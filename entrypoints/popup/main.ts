import './style.css';

import { activeIconPack, extensionEnabled } from '../../src/storage/settings';
import type { ThemePackId } from '../../src/icon-engine/types';

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
            <option value="default">Material Icon Theme</option>
            <option value="vscode-icons">VSCode Icons</option>
            <option value="seti">Seti UI</option>
          </select>
        </dd>
      </div>
    </dl>
  </main>
`;

const enabledToggle = document.querySelector<HTMLInputElement>('#enabled')!;
const themeSelect = document.querySelector<HTMLSelectElement>('#theme-select')!;

function packToThemeValue(pack: ThemePackId): string {
  if (pack === 'vscode-icons' || pack === 'seti') return pack;
  return 'default';
}

function renderPack(pack: ThemePackId) {
  themeSelect.value = packToThemeValue(pack);
}

async function bootstrap() {
  const [enabled, pack] = await Promise.all([
    extensionEnabled.getValue(),
    activeIconPack.getValue(),
  ]);

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
