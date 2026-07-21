import {
  render,
  screen,
  fireEvent,
  waitForElementToBeRemoved,
} from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import App from './App.jsx'
import { createDb } from './db/database.js'
import { createRepository, DEFAULT_LIST_ID } from './db/repository.js'

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
})
