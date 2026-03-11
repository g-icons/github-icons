import { GitHubAdapter } from './github';
import type { SiteAdapter } from './types';

export function detectSiteAdapter(): SiteAdapter | null {
  const adapter = new GitHubAdapter();
  return adapter.detect() ? adapter : null;
}
