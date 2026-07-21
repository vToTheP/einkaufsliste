import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

  it('markiert ein Item beim Tap als erledigt und wieder zurück', async () => {
    renderApp()

    await addItem('Milch')

    const checkbox = screen.getByRole('checkbox', { name: 'Milch' })
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
    await screen.findByRole('checkbox', { name: 'Milch', checked: true })

    fireEvent.click(checkbox)
    await screen.findByRole('checkbox', { name: 'Milch', checked: false })
  })

  it('stellt den erledigt-Zustand nach einem Reload wieder her', async () => {
    const { unmount } = renderApp()

    await addItem('Käse')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Käse' }))
    await screen.findByRole('checkbox', { name: 'Käse', checked: true })
    unmount()

    renderApp()
    expect(
      await screen.findByRole('checkbox', { name: 'Käse' }),
    ).toBeChecked()
  })

  it('entfernt ein Item dauerhaft', async () => {
    const { unmount } = renderApp()

    await addItem('Milch')
    fireEvent.click(screen.getByRole('button', { name: 'Milch löschen' }))

    expect(await screen.findByText('Deine Liste ist leer.')).toBeInTheDocument()
    expect(screen.queryByText('Milch')).not.toBeInTheDocument()

    // Bleibt auch nach Reload entfernt.
    unmount()
    renderApp()
    expect(await screen.findByText('Deine Liste ist leer.')).toBeInTheDocument()
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

  it('behält den erledigt-Zustand beim Umbenennen', async () => {
    renderApp()

    await addItem('Milch')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))
    await screen.findByRole('checkbox', { name: 'Milch', checked: true })
    fireEvent.click(screen.getByRole('button', { name: 'Milch bearbeiten' }))
    fireEvent.change(screen.getByLabelText('Item-Name bearbeiten'), {
      target: { value: 'Hafermilch' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(
      await screen.findByRole('checkbox', { name: 'Hafermilch' }),
    ).toBeChecked()
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

    await screen.findByRole('option', { name: 'Einkaufsliste' })
    expect(screen.getByRole('combobox', { name: 'Liste' })).toHaveDisplayValue(
      'Einkaufsliste',
    )
  })

  async function createList(name) {
    await submitDraft('Neue Liste', 'Liste anlegen', name, () =>
      screen.findByRole('option', { name: name.trim() }),
    )
  }

  it('legt eine neue Liste an, macht sie aktiv und zeigt sie leer', async () => {
    renderApp()
    await screen.findByRole('option', { name: 'Einkaufsliste' })
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
    await screen.findByRole('option', { name: 'Einkaufsliste' })

    await createList('')
    await createList('   ')

    expect(
      screen.queryByRole('option', { name: '' }),
    ).not.toBeInTheDocument()
    expect(screen.getAllByRole('option')).toHaveLength(1)
  })

  it('wechselt zwischen Listen und zeigt jeweils die zugeordneten Items', async () => {
    renderApp()
    await screen.findByRole('option', { name: 'Einkaufsliste' })
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
    await screen.findByRole('option', { name: 'Einkaufsliste' })

    await createList('Wocheneinkauf')
    await addItem('Bier')
    unmount()

    renderApp()
    await screen.findByRole('option', { name: 'Wocheneinkauf' })

    expect(
      screen.getByRole('combobox', { name: 'Liste' }),
    ).toHaveDisplayValue('Wocheneinkauf')
    expect(await screen.findByText('Bier')).toBeInTheDocument()
  })

  it('benennt die aktive Liste um', async () => {
    renderApp()
    await screen.findByRole('option', { name: 'Einkaufsliste' })

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
    await screen.findByRole('option', { name: 'Einkaufsliste' })

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
    await screen.findByRole('option', { name: 'Einkaufsliste' })

    fireEvent.click(screen.getByRole('button', { name: 'Liste umbenennen' }))
    fireEvent.change(screen.getByLabelText('Listenname bearbeiten'), {
      target: { value: 'Wochenendeinkauf' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    await screen.findByRole('option', { name: 'Wochenendeinkauf' })
    unmount()

    renderApp()
    expect(
      await screen.findByRole('option', { name: 'Wochenendeinkauf' }),
    ).toBeInTheDocument()
  })

  it('Guard: der Löschen-Button ist deaktiviert, solange nur eine Liste existiert', async () => {
    renderApp()
    await screen.findByRole('option', { name: 'Einkaufsliste' })

    expect(screen.getByRole('button', { name: 'Liste löschen' })).toBeDisabled()
  })

  it('löscht die aktive Liste und macht eine andere Liste aktiv', async () => {
    renderApp()
    await screen.findByRole('option', { name: 'Einkaufsliste' })
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

  it('erlaubt Abhaken und Bearbeiten innerhalb einer Kategorie-Gruppe', async () => {
    renderApp()
    await addItem('Milch')

    fireEvent.click(screen.getByRole('checkbox', { name: 'Milch' }))
    await screen.findByRole('checkbox', { name: 'Milch', checked: true })

    fireEvent.click(screen.getByRole('button', { name: 'Milch bearbeiten' }))
    fireEvent.change(screen.getByLabelText('Item-Name bearbeiten'), {
      target: { value: 'Hafermilch' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))

    expect(
      await screen.findByRole('checkbox', { name: 'Hafermilch', checked: true }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Milchprodukte & Eier' }),
    ).toBeInTheDocument()
  })
})
