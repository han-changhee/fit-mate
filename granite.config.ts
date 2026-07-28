import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'fit-mate',
  web: {
    host: 'localhost',
    port: 3000,
    commands: {
      dev: 'rsbuild dev',
      build: 'rsbuild build',
    },
  },
  permissions: [],
  outdir: 'dist',
  brand: {
    displayName: '피트메이트',
    icon: 'https://fit-mate-cyan.vercel.app/icon.png',
    primaryColor: '#3182F6',
  },
  webViewProps: {
    type: 'partner',
  },
});
