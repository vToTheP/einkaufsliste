import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base = Repo-Name, damit Assets unter GitHub Pages (Projekt-Seite) korrekt aufgelöst werden.
const base = '/einkaufsliste/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Einkaufsliste',
        short_name: 'Einkauf',
        description: 'Einfache Einkaufsliste als installierbare PWA',
        lang: 'de',
        theme_color: '#16a34a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
  },
})
