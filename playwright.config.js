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
  // Referenz-Screenshots werden im offiziellen Playwright-Container erzeugt
  // (siehe .github/workflows/ci.yml), damit das Font-Rendering deterministisch
  // ist. Die kleine Toleranz fängt nur unvermeidbares Anti-Aliasing-Rauschen ab
  // — eine bewusste UI-Änderung (z.B. andere Akzentfarbe) betrifft weit mehr
  // Pixel und macht die CI trotzdem rot.
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
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
