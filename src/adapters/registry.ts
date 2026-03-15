import { GitHubAdapter } from './github';
import { GitLabAdapter } from './gitlab';
import type { SiteAdapter } from './types';

const ADAPTERS = [GitHubAdapter, GitLabAdapter];

export function detectSiteAdapter(): SiteAdapter | null {
  for (const Adapter of ADAPTERS) {
    const adapter = new Adapter();
    if (adapter.detect()) {
      return adapter;
    }
  }

  return null;
}
