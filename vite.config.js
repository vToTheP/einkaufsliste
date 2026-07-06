import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { createManifest } from './src/pwa/manifest.js'

// base = Repo-Name, damit Assets unter GitHub Pages (Projekt-Seite) korrekt aufgelöst werden.
const base = '/einkaufsliste/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: createManifest(base),
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: false,
    // Vitest nur für Unit-Tests unter src/. Playwright-E2E (e2e/) laufen
    // über `npm run test:e2e`, nicht über Vitest.
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})
