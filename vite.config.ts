import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// base MUST match the exact, case-sensitive GitHub repo name ("OneLife")
// so asset URLs resolve correctly on GitHub Pages.
export default defineConfig({
  base: '/OneLife/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // App-shell caching only (see CLAUDE.md) — data lives in Dexie, not
      // the service worker cache. No runtime caching of Supabase calls.
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
      includeAssets: ['icons/apple-touch-icon.png'],
      manifest: {
        name: 'OneLife',
        short_name: 'OneLife',
        description: 'Personal daily-life PWA — quick capture, tasks, today view, habits.',
        start_url: '/OneLife/',
        scope: '/OneLife/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
