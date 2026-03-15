import { browser } from 'wxt/browser';

const MATCH_PATTERNS = ['https://github.com/*', 'https://gitlab.com/*'];
const CONTENT_SCRIPT_FILE = '/content-scripts/content.js' as const;

async function injectIntoMatchingTabs() {
  let tabs: Browser.tabs.Tab[] = [];

  try {
    tabs = await browser.tabs.query({
      url: MATCH_PATTERNS,
    });
  } catch {
    return;
  }

  await Promise.all(
    tabs
      .map((tab) => tab.id)
      .filter((tabId): tabId is number => typeof tabId === 'number')
      .map(async (tabId) => {
        try {
          await browser.scripting.executeScript({
            target: { tabId },
            files: [CONTENT_SCRIPT_FILE],
          });
        } catch {
          // Ignore tabs we can't access or where the static content script already won.
        }
      }),
  );
}

export default defineBackground(() => {
  void injectIntoMatchingTabs();

  browser.runtime.onInstalled.addListener(() => {
    void injectIntoMatchingTabs();
  });
});
