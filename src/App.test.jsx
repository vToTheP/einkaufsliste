import {
  render,
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import App from './App.jsx'
import { createDb } from './db/database.js'
import { createRepository, DEFAULT_LIST_ID } from './db/repository.js'
import { CATEGORY_ORDER } from './categories.js'

// Jeder Test bekommt eine frisch benannte DB + eigenes Repository → Isolation.
// Persistenz wird über Unmount→Remount geprüft, nicht durch Peeken auf Storage-Keys.
let counter = 0
let db
let repo

beforeEach(() => {
  counter += 1
  db = createDb(`einkaufsliste-app-test-${counter}`)
  repo = createRepository(db)
})

afterEach(async () => {
  await db.delete()
})

function renderApp() {
  return render(<App repository={repo} />)
}

// Gemeinsames Muster für "Draft-Feld befüllen + Formular absenden" hinter
// addItem/createList: unterscheiden sich nur in Label, Button-Text und der
// Wartebedingung fürs Ergebnis.
async function submitDraft(labelText, buttonText, value, waitForResult) {
  fireEvent.change(screen.getByLabelText(labelText), {
    target: { value },
  })
  fireEvent.click(screen.getByRole('button', { name: buttonText }))
  if (value.trim()) {
    await waitForResult()
  }
}

async function addItem(name) {
  await submitDraft('Neues Item', 'Hinzufügen', name, () =>
    screen.findByText(name),
  )
}

// Listen-Aktionen sitzen seit #98 im Sheet/Drawer; öffnen ist idempotent
// (App ruft beim erneuten Tap nur setSheetOpen(true) erneut auf).
function openListMenu() {
  fireEvent.click(screen.getByRole('button', { name: 'Listen-Menü öffnen' }))
}

describe('App', () => {
  it('zeigt den Titel', async () => {
    renderApp()
    expect(
      await screen.findByRole('heading', { name: 'Einkaufsliste' }),
    ).toBeInTheDocument()
  })

  it('zeigt einen Hinweis, wenn die Liste leer ist', async () => {
    renderApp()
    expect(
      await screen.findByText('Deine Liste ist leer.'),
    ).toBeInTheDocument()
  })

  it('fügt ein Item hinzu und zeigt es sofort an', async () => {
    renderApp()

    await addItem('Milch')

    expect(screen.getByText('Milch')).toBeInTheDocument()
    expect(screen.queryByText('Deine Liste ist leer.')).not.toBeInTheDocument()
  })

  it('ignoriert leere Eingaben', async () => {
    renderApp()
    await screen.findByText('Deine Liste ist leer.')

    await addItem('')
    await addItem('   ')

    expect(screen.getByText('Deine Liste ist leer.')).toBeInTheDocument()
  })

  it('behält hinzugefügte Items nach einem Reload (Unmount→Remount)', async () => {
    const { unmount } = renderApp()

    await addItem('Brot')
    unmount()

    renderApp()
    expect(await screen.findByText('Brot')).toBeInTheDocument()
  })

  it('verschiebt ein Item beim Abhaken nach Zuletzt verwendet', async () => {
    renderApp()

    await addItem('Milch')
    const checkbox = screen.getByRole('checkbox', { name: 'Milch' })
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)

    expect(await screen.findByText('Deine Liste ist leer.')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox', { name: 'Milch' })).not.toBeInTheDocument()
    expect(
      await screen.findByRole('heading', { name: 'Zuletzt verwendet' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Milch reaktivieren' }),
    ).toBeInTheDocument()
  })

  it('verschiebt ein Item beim Entfernen ebenfalls nach Zuletzt verwendet statt es zu löschen', async () => {
    renderApp()

    await addItem('Milch')
    fireEvent.click(screen.getByRole('button', { name: 'Milch entfernen' }))

    expect(await screen.findByText('Deine Liste ist leer.')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: 'Milch reaktivieren' }),
    ).toBeInTheDocument()
  })

  it('behält Zuletzt-verwendet-Items nach einem Reload', async () => {
    const { unmount } = renderApp()

    await addItem('Käse')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Käse' }))
    await screen.findByRole('button', { name: 'Käse reaktivieren' })
    unmount()

    renderApp()
    expect(
      await screen.findByRole('button', { name: 'Käse reaktivieren' }),
    ).toBeInTheDocument()
  })

  it('reaktiviert ein Item aus Zuletzt verwendet wieder als offen', async () => {
    renderApp()

    await addItem('Milch')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))
    await screen.findByRole('button', { name: 'Milch reaktivieren' })

    fireEvent.click(screen.getByRole('button', { name: 'Milch reaktivieren' }))

    expect(
      await screen.findByRole('checkbox', { name: 'Milch' }),
    ).not.toBeChecked()
    expect(
      screen.queryByRole('button', { name: 'Milch reaktivieren' }),
    ).not.toBeInTheDocument()
  })

  it('dedupliziert beim Reaktivieren: existiert bereits ein offenes Item gleichen Namens, bleibt es archiviert', async () => {
    renderApp()

    await addItem('Milch')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))
    await screen.findByRole('button', { name: 'Milch reaktivieren' })
    await addItem('Milch')
    // addItem wartet nur auf den Text „Milch" — der steht (aus dem archivierten
    // Item) schon da. Explizit auf die Checkbox warten stellt sicher, dass das
    // zweite (offene) Item wirklich im State angekommen ist, bevor reaktiviert wird.
    await screen.findByRole('checkbox', { name: 'Milch' })

    fireEvent.click(screen.getByRole('button', { name: 'Milch reaktivieren' }))

    await screen.findAllByText('Milch')
    expect(screen.getAllByRole('checkbox', { name: 'Milch' })).toHaveLength(1)
    expect(
      screen.getByRole('button', { name: 'Milch reaktivieren' }),
    ).toBeInTheDocument()
  })

  it('entfernt ein archiviertes Item über "Endgültig entfernen" dauerhaft', async () => {
    const { unmount } = renderApp()

    await addItem('Milch')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))
    const reactivateButton = await screen.findByRole('button', {
      name: 'Milch reaktivieren',
    })

    fireEvent.click(
      screen.getByRole('button', { name: 'Milch endgültig entfernen' }),
    )
    await waitForElementToBeRemoved(reactivateButton)

    expect(
      screen.queryByRole('heading', { name: 'Zuletzt verwendet' }),
    ).not.toBeInTheDocument()

    // Bleibt auch nach Reload entfernt.
    unmount()
    renderApp()
    expect(await screen.findByText('Deine Liste ist leer.')).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Zuletzt verwendet' }),
    ).not.toBeInTheDocument()
  })

  it('bearbeitet den Namen eines Items', async () => {
    renderApp()

    await addItem('Milch')
    fireEvent.click(screen.getByRole('button', { name: 'Milch bearbeiten' }))
    fireEvent.change(screen.getByLabelText('Item-Name bearbeiten'), {
      target: { value: 'Hafermilch' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(await screen.findByText('Hafermilch')).toBeInTheDocument()
    expect(screen.queryByText('Milch')).not.toBeInTheDocument()
  })

  it('persistiert den bearbeiteten Namen nach einem Reload', async () => {
    const { unmount } = renderApp()

    await addItem('Milch')
    fireEvent.click(screen.getByRole('button', { name: 'Milch bearbeiten' }))
    fireEvent.change(screen.getByLabelText('Item-Name bearbeiten'), {
      target: { value: 'Hafermilch' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    await screen.findByText('Hafermilch')
    unmount()

    renderApp()
    expect(await screen.findByText('Hafermilch')).toBeInTheDocument()
  })

  it('ignoriert eine leere Umbenennung', async () => {
    renderApp()

    await addItem('Milch')
    fireEvent.click(screen.getByRole('button', { name: 'Milch bearbeiten' }))
    fireEvent.change(screen.getByLabelText('Item-Name bearbeiten'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(await screen.findByText('Milch')).toBeInTheDocument()
  })
})

describe('App – mehrere Listen', () => {
  it('zeigt die aktive Liste in der Listenauswahl', async () => {
    renderApp()

    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    openListMenu()

    expect(
      await screen.findByRole('combobox', { name: 'Liste' }),
    ).toHaveDisplayValue('Einkaufsliste')
  })

  async function createList(name) {
    openListMenu()
    await submitDraft('Neue Liste', 'Liste anlegen', name, () =>
      screen.findByRole('option', { name: name.trim() }),
    )
  }

  it('legt eine neue Liste an, macht sie aktiv und zeigt sie leer', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    await addItem('Milch')

    await createList('Wocheneinkauf')
    await screen.findByRole('option', { name: 'Wocheneinkauf' })

    expect(
      screen.getByRole('combobox', { name: 'Liste' }),
    ).toHaveDisplayValue('Wocheneinkauf')
    expect(await screen.findByText('Deine Liste ist leer.')).toBeInTheDocument()
    expect(screen.queryByText('Milch')).not.toBeInTheDocument()
  })

  it('ignoriert eine leere oder nur-Whitespace Listen-Eingabe', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })

    await createList('')
    await createList('   ')

    expect(
      screen.queryByRole('option', { name: '' }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('wechselt zwischen Listen und zeigt jeweils die zugeordneten Items', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    await addItem('Milch')

    await createList('Wocheneinkauf')
    await addItem('Bier')
    expect(screen.getByText('Bier')).toBeInTheDocument()
    expect(screen.queryByText('Milch')).not.toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Liste' }), {
      target: { value: DEFAULT_LIST_ID },
    })

    expect(await screen.findByText('Milch')).toBeInTheDocument()
    expect(screen.queryByText('Bier')).not.toBeInTheDocument()
  })

  it('behält die aktive Liste nach einem Reload (Unmount→Remount)', async () => {
    const { unmount } = renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })

    await createList('Wocheneinkauf')
    await addItem('Bier')
    unmount()

    renderApp()
    await screen.findByRole('heading', { name: 'Wocheneinkauf', level: 1 })
    openListMenu()
    await screen.findByRole('option', { name: 'Wocheneinkauf' })

    expect(
      screen.getByRole('combobox', { name: 'Liste' }),
    ).toHaveDisplayValue('Wocheneinkauf')
    expect(await screen.findByText('Bier')).toBeInTheDocument()
  })

  it('benennt die aktive Liste um', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    openListMenu()

    fireEvent.click(screen.getByRole('button', { name: 'Liste umbenennen' }))
    fireEvent.change(screen.getByLabelText('Listenname bearbeiten'), {
      target: { value: 'Wochenendeinkauf' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    await screen.findByRole('option', { name: 'Wochenendeinkauf' })
    expect(
      screen.getByRole('combobox', { name: 'Liste' }),
    ).toHaveDisplayValue('Wochenendeinkauf')
  })

  it('ignoriert eine leere Listen-Umbenennung', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    openListMenu()

    fireEvent.click(screen.getByRole('button', { name: 'Liste umbenennen' }))
    fireEvent.change(screen.getByLabelText('Listenname bearbeiten'), {
      target: { value: '   ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(
      await screen.findByRole('option', { name: 'Einkaufsliste' }),
    ).toBeInTheDocument()
  })

  it('behält die umbenannte Liste nach einem Reload', async () => {
    const { unmount } = renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    openListMenu()

    fireEvent.click(screen.getByRole('button', { name: 'Liste umbenennen' }))
    fireEvent.change(screen.getByLabelText('Listenname bearbeiten'), {
      target: { value: 'Wochenendeinkauf' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    await screen.findByRole('option', { name: 'Wochenendeinkauf' })
    unmount()

    renderApp()
    await screen.findByRole('heading', { name: 'Wochenendeinkauf', level: 1 })
    openListMenu()
    expect(
      await screen.findByRole('option', { name: 'Wochenendeinkauf' }),
    ).toBeInTheDocument()
  })

  it('Guard: der Löschen-Button ist deaktiviert, solange nur eine Liste existiert', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    openListMenu()

    expect(
      await screen.findByRole('button', { name: 'Liste löschen' }),
    ).toBeDisabled()
  })

  it('löscht die aktive Liste und macht eine andere Liste aktiv', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    await addItem('Milch')

    await createList('Wocheneinkauf')
    await addItem('Bier')
    fireEvent.click(screen.getByRole('button', { name: 'Liste löschen' }))

    await waitFor(() =>
      expect(
        screen.queryByRole('option', { name: 'Wocheneinkauf' }),
      ).not.toBeInTheDocument(),
    )
    expect(
      screen.getByRole('combobox', { name: 'Liste' }),
    ).toHaveDisplayValue('Einkaufsliste')
    expect(await screen.findByText('Milch')).toBeInTheDocument()
    expect(screen.queryByText('Bier')).not.toBeInTheDocument()
  })
})

describe('App – Kategorien', () => {
  it('gruppiert Items nach Kategorie in fester Standard-Reihenfolge', async () => {
    renderApp()
    await screen.findByText('Deine Liste ist leer.')

    // Bewusst in "falscher" Reihenfolge angelegt (Milchprodukte vor Brot).
    await addItem('Käse')
    await addItem('Brot')

    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((heading) => heading.textContent)
    const brotIndex = CATEGORY_ORDER.indexOf('Brot & Backwaren')
    const milchIndex = CATEGORY_ORDER.indexOf('Milchprodukte & Eier')
    expect(brotIndex).toBeLessThan(milchIndex)
    expect(headings).toEqual(['Brot & Backwaren', 'Milchprodukte & Eier'])
  })

  it('zeigt Kategorien ohne Items nicht an', async () => {
    renderApp()
    await addItem('Milch')

    expect(
      screen.queryByRole('heading', { name: 'Getränke' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Milchprodukte & Eier' }),
    ).toBeInTheDocument()
  })

  it('ordnet unbekannte Artikel der Kategorie Sonstiges zu', async () => {
    renderApp()
    await addItem('Glühbirne')

    expect(
      screen.getByRole('heading', { name: 'Sonstiges' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Glühbirne')).toBeInTheDocument()
  })

  // Kombiniertes Verhalten aus #45 (Kategorien) + #46 (Zuletzt verwendet):
  // Bearbeiten passiert weiterhin innerhalb der Kategorie-Gruppe; Abhaken
  // archiviert das Item aber (statt es abgehakt in der Gruppe zu lassen) und
  // verschiebt es nach „Zuletzt verwendet".
  it('erlaubt Bearbeiten in einer Kategorie-Gruppe; Abhaken archiviert das Item', async () => {
    renderApp()
    await addItem('Milch')

    fireEvent.click(screen.getByRole('button', { name: 'Milch bearbeiten' }))
    fireEvent.change(screen.getByLabelText('Item-Name bearbeiten'), {
      target: { value: 'Hafermilch' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(await screen.findByText('Hafermilch')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Milchprodukte & Eier' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: 'Hafermilch' }))

    expect(
      await screen.findByRole('button', { name: 'Hafermilch reaktivieren' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('checkbox', { name: 'Hafermilch' }),
    ).not.toBeInTheDocument()
  })

  // Issue #96: unmissverständliche Aktionen (Hinzufügen/Bearbeiten/Entfernen,
  // Listen-Anlegen/Umbenennen/Löschen) werden zu Icon-Buttons; das aria-label
  // bleibt unverändert, deshalb finden alle obigen getByRole(...)-Aufrufe sie
  // weiterhin unter demselben Namen.
  it('zeigt Icon-Buttons für Hinzufügen, Bearbeiten und Entfernen', async () => {
    renderApp()
    await addItem('Milch')

    expect(
      screen.getByRole('button', { name: 'Hinzufügen' }).querySelector('svg'),
    ).toBeInTheDocument()
    expect(
      screen
        .getByRole('button', { name: 'Milch bearbeiten' })
        .querySelector('svg'),
    ).toBeInTheDocument()
    expect(
      screen
        .getByRole('button', { name: 'Milch entfernen' })
        .querySelector('svg'),
    ).toBeInTheDocument()
  })

  it('zeigt Icon-Buttons für Listen-Aktionen (Anlegen/Umbenennen/Löschen)', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    expect(
      screen
        .getByRole('button', { name: 'Listen-Menü öffnen' })
        .querySelector('svg'),
    ).toBeInTheDocument()
    openListMenu()
    await screen.findByRole('option', { name: 'Einkaufsliste' })

    expect(
      screen.getByRole('button', { name: 'Liste anlegen' }).querySelector('svg'),
    ).toBeInTheDocument()
    expect(
      screen
        .getByRole('button', { name: 'Liste umbenennen' })
        .querySelector('svg'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Liste löschen' }).querySelector('svg'),
    ).toBeInTheDocument()
  })

  it('behält Text bei mehrdeutigen Aktionen in „Zuletzt verwendet"', async () => {
    renderApp()
    await addItem('Milch')
    fireEvent.click(screen.getByRole('button', { name: 'Milch entfernen' }))

    expect(
      await screen.findByRole('button', { name: 'Milch reaktivieren' }),
    ).toHaveTextContent('Reaktivieren')
    expect(
      screen.getByRole('button', { name: 'Milch endgültig entfernen' }),
    ).toHaveTextContent('Endgültig entfernen')
  })
})

// Issue #98: Listen-Verwaltung sitzt jetzt in einem Sheet/Drawer statt im
// Kopfbereich zu stapeln. Verhalten der Aktionen selbst ist unverändert
// (oben abgedeckt) — hier geht es um Öffnen/Schließen, Fokus und Tastatur.
describe('App – Sheet/Drawer', () => {
  it('öffnet das Sheet über den Menü-Button und macht die Listen-Aktionen erreichbar', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    openListMenu()

    expect(
      await screen.findByRole('dialog', { name: 'Listen-Menü' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Liste' })).toBeInTheDocument()
  })

  it('fokussiert beim Öffnen ein Element innerhalb des Sheets', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })

    openListMenu()

    const dialog = await screen.findByRole('dialog', { name: 'Listen-Menü' })
    await waitFor(() =>
      expect(dialog).toContainElement(document.activeElement),
    )
  })

  it('schließt das Sheet über den Schließen-Button und gibt den Fokus an den Menü-Button zurück', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    const menuButton = screen.getByRole('button', {
      name: 'Listen-Menü öffnen',
    })
    openListMenu()
    await screen.findByRole('dialog', { name: 'Listen-Menü' })

    fireEvent.click(screen.getByRole('button', { name: 'Menü schließen' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(menuButton).toHaveFocus()
  })

  it('schließt das Sheet über die Escape-Taste und gibt den Fokus zurück', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    const menuButton = screen.getByRole('button', {
      name: 'Listen-Menü öffnen',
    })
    openListMenu()
    const dialog = await screen.findByRole('dialog', { name: 'Listen-Menü' })

    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(menuButton).toHaveFocus()
  })

  it('schließt das Sheet über einen Klick auf den Hintergrund', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    openListMenu()
    const dialog = await screen.findByRole('dialog', { name: 'Listen-Menü' })

    fireEvent.click(dialog.parentElement)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('hält den Fokus innerhalb des Sheets, wenn am Ende weiter getabbt wird', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    openListMenu()
    const dialog = await screen.findByRole('dialog', { name: 'Listen-Menü' })
    screen.getByRole('button', { name: 'Liste anlegen' }).focus()

    fireEvent.keyDown(dialog, { key: 'Tab' })

    expect(
      screen.getByRole('button', { name: 'Menü schließen' }),
    ).toHaveFocus()
  })

  it('hält den Fokus innerhalb des Sheets, wenn am Anfang zurück getabbt wird', async () => {
    renderApp()
    await screen.findByRole('heading', { name: 'Einkaufsliste', level: 1 })
    openListMenu()
    const dialog = await screen.findByRole('dialog', { name: 'Listen-Menü' })
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Menü schließen' }),
      ).toHaveFocus(),
    )

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })

    expect(
      screen.getByRole('button', { name: 'Liste anlegen' }),
    ).toHaveFocus()
  })
})
