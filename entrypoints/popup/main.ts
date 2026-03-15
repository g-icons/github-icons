import './style.css';

import { browser } from 'wxt/browser';
import { activeIconPack, enabledGithub, enabledGitlab } from '../../src/storage/settings';
import type { MaterialPackId, ThemeId, ThemePackId } from '../../src/icon-engine/types';

type SiteId = 'github' | 'gitlab';

const TOP_LEVEL_THEMES: { value: ThemeId; label: string }[] = [
  { value: 'material', label: 'Material Icon Theme' },
  { value: 'vscode-icons', label: 'VSCode Icons' },
  { value: 'seti', label: 'Seti UI' },
  { value: 'symbols', label: 'Symbols' },
  { value: 'catppuccin', label: 'Catppuccin' },
  { value: 'great-icons', label: 'Great Icons' },
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

const STANDALONE_THEMES: Set<string> = new Set(['vscode-icons', 'seti', 'symbols', 'catppuccin', 'great-icons']);
const SITE_ORIGINS: Record<SiteId, string> = {
  github: 'https://github.com/*',
  gitlab: 'https://gitlab.com/*',
};
const CONTENT_SCRIPT_FILE = '/content-scripts/content.js' as const;

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
        <dt>
          Enable on GitHub
          <span id="github-access-hint" class="permission-hint hidden">
            Site access missing.
            <button id="grant-github-access" class="permission-button" type="button">Grant access</button>
          </span>
        </dt>
        <dd><label class="toggle"><input id="enabled-github" type="checkbox" /><span class="toggle-track"></span></label></dd>
      </div>
      <div>
        <dt>
          Enable on GitLab
          <span id="gitlab-access-hint" class="permission-hint hidden">
            Site access missing.
            <button id="grant-gitlab-access" class="permission-button" type="button">Grant access</button>
          </span>
        </dt>
        <dd><label class="toggle"><input id="enabled-gitlab" type="checkbox" /><span class="toggle-track"></span></label></dd>
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

const githubToggle = document.querySelector<HTMLInputElement>('#enabled-github')!;
const gitlabToggle = document.querySelector<HTMLInputElement>('#enabled-gitlab')!;
const githubAccessHint = document.querySelector<HTMLSpanElement>('#github-access-hint')!;
const gitlabAccessHint = document.querySelector<HTMLSpanElement>('#gitlab-access-hint')!;
const githubGrantButton = document.querySelector<HTMLButtonElement>('#grant-github-access')!;
const gitlabGrantButton = document.querySelector<HTMLButtonElement>('#grant-gitlab-access')!;
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

function getToggle(site: SiteId): HTMLInputElement {
  return site === 'github' ? githubToggle : gitlabToggle;
}

function getAccessHint(site: SiteId): HTMLSpanElement {
  return site === 'github' ? githubAccessHint : gitlabAccessHint;
}

function getSetting(site: SiteId) {
  return site === 'github' ? enabledGithub : enabledGitlab;
}

async function hasSiteAccess(site: SiteId): Promise<boolean> {
  try {
    return await browser.permissions.contains({
      origins: [SITE_ORIGINS[site]],
    });
  } catch {
    return true;
  }
}

async function requestSiteAccess(site: SiteId): Promise<boolean> {
  try {
    return await browser.permissions.request({
      origins: [SITE_ORIGINS[site]],
    });
  } catch {
    return false;
  }
}

async function syncSiteAccessHint(site: SiteId) {
  const [enabled, hasAccess] = await Promise.all([
    getSetting(site).getValue(),
    hasSiteAccess(site),
  ]);

  getAccessHint(site).classList.toggle('hidden', !enabled || hasAccess);
}

function detectSiteFromUrl(url: string | undefined): SiteId | null {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.hostname === 'github.com') {
      return 'github';
    }

    if (parsed.hostname === 'gitlab.com' || parsed.hostname.endsWith('.gitlab.com')) {
      return 'gitlab';
    }
  } catch {}

  return null;
}

async function injectActiveTabIfNeeded() {
  let activeTab: Browser.tabs.Tab | undefined;

  try {
    [activeTab] = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
  } catch {
    return;
  }

  const tabId = activeTab?.id;
  const site = detectSiteFromUrl(activeTab?.url);

  if (typeof tabId !== 'number' || !site) {
    return;
  }

  const [enabled, hasAccess] = await Promise.all([
    getSetting(site).getValue(),
    hasSiteAccess(site),
  ]);

  if (!enabled || !hasAccess) {
    return;
  }

  try {
    await browser.scripting.executeScript({
      target: { tabId },
      files: [CONTENT_SCRIPT_FILE],
    });
  } catch {
    // The static content script may already be present, or the tab may be restricted.
  }
}

async function setSiteEnabled(site: SiteId, enabled: boolean) {
  const toggle = getToggle(site);
  toggle.disabled = true;

  try {
    if (enabled) {
      const granted = await requestSiteAccess(site) || await hasSiteAccess(site);
      if (!granted) {
        toggle.checked = false;
        await getSetting(site).setValue(false);
        await syncSiteAccessHint(site);
        return;
      }
    }

    await getSetting(site).setValue(enabled);
    await syncSiteAccessHint(site);
    if (enabled) {
      await injectActiveTabIfNeeded();
    }
  } finally {
    toggle.disabled = false;
  }
}

async function bootstrap() {
  const [github, gitlab, pack] = await Promise.all([enabledGithub.getValue(), enabledGitlab.getValue(), activeIconPack.getValue()]);

  githubToggle.checked = github;
  gitlabToggle.checked = gitlab;
  renderPack(pack);
  await Promise.all([syncSiteAccessHint('github'), syncSiteAccessHint('gitlab')]);
  await injectActiveTabIfNeeded();
}

githubToggle.addEventListener('change', async () => {
  await setSiteEnabled('github', githubToggle.checked);
});

gitlabToggle.addEventListener('change', async () => {
  await setSiteEnabled('gitlab', gitlabToggle.checked);
});

githubGrantButton.addEventListener('click', async () => {
  await setSiteEnabled('github', true);
});

gitlabGrantButton.addEventListener('click', async () => {
  await setSiteEnabled('gitlab', true);
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

enabledGithub.watch((enabled) => {
  githubToggle.checked = enabled;
  void syncSiteAccessHint('github');
});
enabledGitlab.watch((enabled) => {
  gitlabToggle.checked = enabled;
  void syncSiteAccessHint('gitlab');
});
activeIconPack.watch((pack) => renderPack(pack));

void bootstrap();
