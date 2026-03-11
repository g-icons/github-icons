import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'GitHub Material Icons',
    description:
      'Replace GitHub file and folder icons with Material Design icons.',
    permissions: ['storage'],
    host_permissions: ['https://github.com/*'],
    action: {
      default_title: 'GitHub Material Icons',
    },
    web_accessible_resources: [
      {
        resources: ['icons/*'],
        matches: ['https://github.com/*'],
      },
    ],
  },
});
