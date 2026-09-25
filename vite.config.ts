import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'prompt',
      injectRegister: null,
      includeAssets: [
        'icon.svg',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-512-maskable.png',
      ],
      manifest: {
        name: 'Indo Reader',
        short_name: 'Indo Reader',
        description:
          'Read the Indonesian Bible with English glosses, PBWL root families, and learner vocabulary support.',
        theme_color: '#8b1e3f',
        background_color: '#f7f5f2',
        display: 'standalone',
        orientation: 'any',
        start_url: './',
        scope: './',
        lang: 'id',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        globIgnores: ['corpus/**', 'lexicon/**'],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
});
