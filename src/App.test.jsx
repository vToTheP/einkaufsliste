import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App.jsx'

describe('App', () => {
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
})
