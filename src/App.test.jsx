import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import App from './App.jsx'

const STORAGE_KEY = 'einkaufsliste:items'

function addItem(name) {
  fireEvent.change(screen.getByLabelText('Neues Item'), {
    target: { value: name },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Hinzufügen' }))
}

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('zeigt den Titel', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: 'Einkaufsliste' }),
    ).toBeInTheDocument()
  })

  it('zeigt einen Hinweis, wenn die Liste leer ist', () => {
    render(<App />)
    expect(screen.getByText('Deine Liste ist leer.')).toBeInTheDocument()
  })

  it('fügt ein Item hinzu und zeigt es sofort an', () => {
    render(<App />)

    addItem('Milch')

    expect(screen.getByText('Milch')).toBeInTheDocument()
    expect(screen.queryByText('Deine Liste ist leer.')).not.toBeInTheDocument()
  })

  it('ignoriert leere Eingaben', () => {
    render(<App />)

    addItem('')
    addItem('   ')

    expect(screen.getByText('Deine Liste ist leer.')).toBeInTheDocument()
  })

  it('speichert Items in localStorage', () => {
    render(<App />)

    addItem('Brot')

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({ name: 'Brot' })
    expect(typeof stored[0].id).toBe('string')
  })

  it('lädt gespeicherte Items nach einem Reload', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: '1', name: 'Butter' }]),
    )

    render(<App />)

    expect(screen.getByText('Butter')).toBeInTheDocument()
  })

  it('markiert ein Item beim Tap als erledigt und wieder zurück', () => {
    render(<App />)

    addItem('Milch')

    const checkbox = screen.getByRole('checkbox', { name: 'Milch' })
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()

    fireEvent.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })

  it('persistiert den erledigt-Zustand in localStorage', () => {
    render(<App />)

    addItem('Brot')
    fireEvent.click(screen.getByRole('checkbox', { name: 'Brot' }))

    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(stored[0]).toMatchObject({ name: 'Brot', done: true })
  })

  it('stellt den erledigt-Zustand nach einem Reload wieder her', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: '1', name: 'Käse', done: true }]),
    )

    render(<App />)

    expect(screen.getByRole('checkbox', { name: 'Käse' })).toBeChecked()
  })
})
