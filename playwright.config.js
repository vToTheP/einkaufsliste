import { defineConfig, devices } from '@playwright/test'

// E2E gegen die *gebaute* App via `vite preview`. Wichtig: `base` = /einkaufsliste/,
// daher lauscht der Preview-Server unter diesem Pfad (Root `/` liefert 404).
const PORT = 4173
const BASE_PATH = '/einkaufsliste/'
const baseURL = `http://localhost:${PORT}${BASE_PATH}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run preview',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
