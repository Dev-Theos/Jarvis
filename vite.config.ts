import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import { builtinModules } from 'node:module';
import path from 'node:path';

const nodeExternals = [
  'electron',
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`),
];

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            lib: {
              entry: 'electron/main.ts',
              formats: ['es'],
              fileName: () => 'main.js',
            },
            rollupOptions: {
              external: nodeExternals,
            },
            emptyOutDir: false,
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          build: {
            outDir: 'dist-electron',
            rollupOptions: {
              external: nodeExternals,
              output: {
                entryFileNames: 'preload.mjs',
                format: 'es',
              },
            },
            emptyOutDir: false,
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@core': path.resolve(__dirname, 'core'),
    },
  },
  server: {
    port: 5173,
  },
  clearScreen: false,
});
