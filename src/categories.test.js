import { describe, it, expect } from 'vitest'
import { categorize, CATEGORY_ORDER, DEFAULT_CATEGORY } from './categories.js'

describe('categorize', () => {
  it('ordnet bekannte Artikel ihrer Kategorie zu', () => {
    expect(categorize('Milch')).toBe('Milchprodukte & Eier')
    expect(categorize('Brot')).toBe('Brot & Backwaren')
    expect(categorize('Apfel')).toBe('Obst & Gemüse')
  })

  it('ist case-insensitiv', () => {
    expect(categorize('MILCH')).toBe('Milchprodukte & Eier')
    expect(categorize('milch')).toBe('Milchprodukte & Eier')
  })

  it('erkennt das Wort auch innerhalb einer Mengenangabe', () => {
    expect(categorize('2 Bananen')).toBe('Obst & Gemüse')
  })

  it('unterscheidet ähnliche Wörter (kein Substring-Treffer)', () => {
    // "Reis" enthält "eis" als Substring, darf aber nicht in Tiefkühl landen.
    expect(categorize('Reis')).toBe('Vorräte & Konserven')
    expect(categorize('Eis')).toBe('Tiefkühl')
  })

  it('fällt ohne Treffer auf Sonstiges zurück', () => {
    expect(categorize('Glühbirne')).toBe(DEFAULT_CATEGORY)
    expect(categorize('')).toBe(DEFAULT_CATEGORY)
  })

  it('CATEGORY_ORDER enthält Sonstiges als letzten Eintrag', () => {
    expect(CATEGORY_ORDER[CATEGORY_ORDER.length - 1]).toBe(DEFAULT_CATEGORY)
  })
})
