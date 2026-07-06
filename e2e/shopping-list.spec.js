import { test, expect } from '@playwright/test'

// End-to-End der Kern-Flows im echten Browser gegen die gebaute App.
// Jeder Test bekommt von Playwright einen frischen Browser-Context, d.h.
// localStorage startet leer — keine manuelle Aufräumlogik nötig.

const addItem = async (page, name) => {
  await page.getByLabel('Neues Item').fill(name)
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
}

test.beforeEach(async ({ page }) => {
  // Relativ zur baseURL (inkl. /einkaufsliste/-Basispfad).
  await page.goto('./')
})

test('startet mit leerer Liste', async ({ page }) => {
  await expect(
    page.getByRole('heading', { name: 'Einkaufsliste' }),
  ).toBeVisible()
  await expect(page.getByText('Deine Liste ist leer.')).toBeVisible()
})

test('fügt ein Item hinzu und zeigt es an', async ({ page }) => {
  await addItem(page, 'Milch')

  await expect(page.getByText('Milch')).toBeVisible()
  await expect(page.getByText('Deine Liste ist leer.')).toBeHidden()
})

test('hakt ein Item ab und wieder zurück', async ({ page }) => {
  await addItem(page, 'Milch')

  const checkbox = page.getByRole('checkbox', { name: 'Milch' })
  await expect(checkbox).not.toBeChecked()

  await checkbox.check()
  await expect(checkbox).toBeChecked()

  await checkbox.uncheck()
  await expect(checkbox).not.toBeChecked()
})

test('benennt ein Item um', async ({ page }) => {
  await addItem(page, 'Milch')

  await page.getByRole('button', { name: 'Milch bearbeiten' }).click()
  await page.getByLabel('Item-Name bearbeiten').fill('Hafermilch')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await expect(page.getByText('Hafermilch')).toBeVisible()
  await expect(page.getByText('Milch', { exact: true })).toBeHidden()
})

test('löscht ein Item dauerhaft', async ({ page }) => {
  await addItem(page, 'Milch')

  await page.getByRole('button', { name: 'Milch löschen' }).click()

  await expect(page.getByText('Milch')).toBeHidden()
  await expect(page.getByText('Deine Liste ist leer.')).toBeVisible()
})

test('behält Items und erledigt-Zustand nach einem Reload', async ({ page }) => {
  await addItem(page, 'Milch')
  await addItem(page, 'Brot')
  await page.getByRole('checkbox', { name: 'Brot' }).check()

  await page.reload()

  await expect(page.getByText('Milch')).toBeVisible()
  await expect(page.getByRole('checkbox', { name: 'Milch' })).not.toBeChecked()
  await expect(page.getByRole('checkbox', { name: 'Brot' })).toBeChecked()
})
