import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode === 'production' ? [webExtension({ manifest: 'public/manifest.json' })] : []),
  ],
  envPrefix: 'REACT_APP_',
  build: {
    outDir: 'build',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
  },
}));
