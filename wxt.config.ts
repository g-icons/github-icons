import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'output',
  manifest: {
    name: 'GitHub Icons',
    description:
      'Replace GitHub and GitLab file icons with distinct, colorful glyphs.',
    permissions: ['storage', 'permissions', 'scripting'],
    host_permissions: ['https://github.com/*', 'https://gitlab.com/*'],
    action: {
      default_title: 'GitHub Icons',
    },
    web_accessible_resources: [
      {
        resources: ['icons/*', 'manifests/*'],
        matches: ['https://github.com/*', 'https://gitlab.com/*'],
      },
    ],
  },
});
