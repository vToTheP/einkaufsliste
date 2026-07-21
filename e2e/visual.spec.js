import { test, expect } from '@playwright/test'

// Visuelle Regressionstests der Hauptansichten. Vergleicht Screenshots des
// App-Containers gegen eingecheckte Referenzbilder (Chromium/Linux).
//
// Die Referenzbilder werden im offiziellen Playwright-Container erzeugt
// (`mcr.microsoft.com/playwright:v1.56.1-noble`) — genau dem Image, in dem
// auch die CI läuft. Dadurch ist das Font-Rendering deterministisch.
//
// Gewollte UI-Änderungen? Referenzen neu erzeugen (siehe README):
//   npm run test:e2e:update

const addItem = async (page, name) => {
  await page.getByLabel('Neues Item').fill(name)
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
  await expect(page.getByText(name, { exact: true })).toBeVisible()
}

// Nur den App-Container aufnehmen: fokussiert und stabil gegenüber
// Viewport-Leerraum. `caret: 'hide'` (Default) blendet den Text-Cursor aus.
const appView = (page) => page.locator('main.app')

test.beforeEach(async ({ page }) => {
  await page.goto('./')
})

test('leere Liste', async ({ page }) => {
  await expect(page.getByText('Deine Liste ist leer.')).toBeVisible()

  await expect(appView(page)).toHaveScreenshot('empty-list.png')
})

test('Liste mit Items', async ({ page }) => {
  await addItem(page, 'Milch')
  await addItem(page, 'Brot')

  await expect(appView(page)).toHaveScreenshot('with-items.png')
})

test('Item in Zuletzt verwendet', async ({ page }) => {
  await addItem(page, 'Milch')
  await addItem(page, 'Brot')
  await page.getByRole('checkbox', { name: 'Brot' }).click()
  await expect(
    page.getByRole('button', { name: 'Brot reaktivieren' }),
  ).toBeVisible()

  await expect(appView(page)).toHaveScreenshot('item-archived.png')
})
