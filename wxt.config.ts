import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'output',
  manifest: {
    name: 'GitHub Icons',
    description:
      'Replace GitHub file and folder icons with distinct, colorful glyphs.',
    permissions: ['storage'],
    host_permissions: ['https://github.com/*'],
    action: {
      default_title: 'GitHub Icons',
    },
    web_accessible_resources: [
      {
        resources: ['icons/*', 'manifests/*'],
        matches: ['https://github.com/*'],
      },
    ],
  },
});
