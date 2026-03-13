import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'output',
  manifest: {
    name: 'GitHub Material Icons',
    description:
      'Replace GitHub file and folder icons with Material Design icons.',
    permissions: ['storage'],
    host_permissions: ['https://github.com/*'],
    icons: {
      '16': 'icon-16.png',
      '48': 'icon-48.png',
      '128': 'icon-128.png',
    },
    action: {
      default_title: 'GitHub Material Icons',
      default_icon: {
        '16': 'icon-16.png',
        '48': 'icon-48.png',
        '128': 'icon-128.png',
      },
    },
    web_accessible_resources: [
      {
        resources: ['icons/*', 'manifests/*'],
        matches: ['https://github.com/*'],
      },
    ],
  },
});
