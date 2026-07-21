import { test, expect } from '@playwright/test'

// End-to-End der Kern-Flows im echten Browser gegen die gebaute App.
// Jeder Test bekommt von Playwright einen frischen Browser-Context, d.h.
// localStorage startet leer — keine manuelle Aufräumlogik nötig.

const addItem = async (page, name) => {
  await page.getByLabel('Neues Item').fill(name)
  await page.getByRole('button', { name: 'Hinzufügen' }).click()
}

// Läuft im Browser-Kontext: liest alle Items direkt aus IndexedDB.
const readItemsInBrowser = () =>
  new Promise((resolve) => {
    const req = indexedDB.open('einkaufsliste')
    req.onerror = () => resolve([])
    req.onsuccess = () => {
      const getAll = req.result
        .transaction('items', 'readonly')
        .objectStore('items')
        .getAll()
      getAll.onsuccess = () => {
        req.result.close()
        resolve(getAll.result)
      }
    }
  })

// Persistenz läuft asynchron nach IndexedDB. Die UI aktualisiert sofort
// (optimistisch), der Schreibvorgang committet Millisekunden später. Vor einem
// programmatischen Reload — schneller als jede menschliche Interaktion — warten
// wir daher, bis der erwartete Zustand tatsächlich im Store liegt.
const waitForPersisted = async (page, name, done) => {
  await expect
    .poll(async () => {
      const items = await page.evaluate(readItemsInBrowser)
      return items.some((item) => item.name === name && item.done === done)
    })
    .toBe(true)
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

  await expect(page.getByText('Milch', { exact: true })).toBeVisible()
  await expect(page.getByText('Deine Liste ist leer.')).toBeHidden()
})

test('verschiebt ein Item beim Abhaken nach Zuletzt verwendet', async ({ page }) => {
  await addItem(page, 'Milch')

  const checkbox = page.getByRole('checkbox', { name: 'Milch' })
  await expect(checkbox).not.toBeChecked()

  await checkbox.click()

  await expect(page.getByText('Deine Liste ist leer.')).toBeVisible()
  await expect(checkbox).toBeHidden()
  await expect(
    page.getByRole('button', { name: 'Milch reaktivieren' }),
  ).toBeVisible()
})

test('reaktiviert ein Item aus Zuletzt verwendet wieder als offen', async ({ page }) => {
  await addItem(page, 'Milch')
  await page.getByRole('checkbox', { name: 'Milch' }).click()

  await page.getByRole('button', { name: 'Milch reaktivieren' }).click()

  const checkbox = page.getByRole('checkbox', { name: 'Milch' })
  await expect(checkbox).toBeVisible()
  await expect(checkbox).not.toBeChecked()
  await expect(
    page.getByRole('button', { name: 'Milch reaktivieren' }),
  ).toBeHidden()
})

test('benennt ein Item um', async ({ page }) => {
  await addItem(page, 'Milch')

  await page.getByRole('button', { name: 'Milch bearbeiten' }).click()
  await page.getByLabel('Item-Name bearbeiten').fill('Hafermilch')
  await page.getByRole('button', { name: 'Speichern' }).click()

  await expect(page.getByText('Hafermilch')).toBeVisible()
  await expect(page.getByText('Milch', { exact: true })).toBeHidden()
})

test('verschiebt ein Item beim Entfernen ebenfalls nach Zuletzt verwendet', async ({
  page,
}) => {
  await addItem(page, 'Milch')

  await page.getByRole('button', { name: 'Milch entfernen' }).click()

  await expect(page.getByText('Deine Liste ist leer.')).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Milch reaktivieren' }),
  ).toBeVisible()
})

test('entfernt ein archiviertes Item über "Endgültig entfernen" dauerhaft', async ({
  page,
}) => {
  await addItem(page, 'Milch')
  await page.getByRole('checkbox', { name: 'Milch' }).click()

  await page
    .getByRole('button', { name: 'Milch endgültig entfernen' })
    .click()

  await expect(
    page.getByRole('button', { name: 'Milch reaktivieren' }),
  ).toBeHidden()
  await expect(page.getByText('Milch')).toBeHidden()
})

test('behält offene und Zuletzt-verwendet-Items nach einem Reload', async ({
  page,
}) => {
  await addItem(page, 'Milch')
  await addItem(page, 'Brot')
  await page.getByRole('checkbox', { name: 'Brot' }).click()

  // Warten, bis der optimistische Toggle durablen IndexedDB-State erreicht hat.
  await waitForPersisted(page, 'Brot', true)
  await page.reload()

  await expect(page.getByRole('checkbox', { name: 'Milch' })).not.toBeChecked()
  await expect(
    page.getByRole('button', { name: 'Brot reaktivieren' }),
  ).toBeVisible()
})
