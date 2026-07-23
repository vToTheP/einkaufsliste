import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

// Gate für die Token-Slice (#95). Zwei maschinell prüfbare Akzeptanzkriterien:
//  - AC1: Komponenten-CSS (App.css) referenziert nur Tokens, keine Rohfarben.
//  - AC4: Kontrast der Token-Paare in Light UND Dark ist WCAG-konform.
// Beides sind sonst manuelle Sichtprüfungen — hier als automatisches Gate.

const read = (name) =>
  readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8')

// Rohfarben: Hex (#abc/#aabbcc/#aabbccdd) sowie rgb()/hsl()-Literale.
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/g

// --- WCAG-Kontrast (Relative Luminanz nach WCAG 2.x) --------------------
function channel(c) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
function luminance(hex) {
  const h = hex.replace('#', '')
  const full =
    h.length === 3
      ? h
          .split('')
          .map((x) => x + x)
          .join('')
      : h
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}
function contrast(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

// Alle `--name: #hex;`-Farbdeklarationen eines CSS-Blocks als Map.
// Nicht-Farb-Tokens (Abstände, Radien, Typo) matchen nicht und fallen raus.
function colorTokens(block) {
  const map = {}
  for (const line of block.split('\n')) {
    // Pro Zeile ankern → kein Backtracking über den ganzen Block.
    const m = /^(--[a-z0-9-]+):\s(#[0-9a-f]{3,8});/i.exec(line.trim())
    if (m) map[m[1]] = m[2]
  }
  return map
}

const indexCss = read('./index.css')
// Light: der erste :root-Block. Dark: der :root-Block im prefers-color-scheme-Media.
const lightBlock = indexCss.slice(indexCss.indexOf(':root'))
const darkMedia = indexCss.slice(indexCss.indexOf('prefers-color-scheme: dark'))
const light = colorTokens(lightBlock.slice(0, lightBlock.indexOf('}')))
const dark = colorTokens(darkMedia.slice(darkMedia.indexOf(':root')))

// Paare (Vordergrund auf Hintergrund) + Mindest-Ratio (WCAG AA Text = 4.5).
const PAIRS = [
  ['--text', '--surface', 4.5],
  ['--text', '--surface-raised', 4.5],
  ['--text-muted', '--surface', 4.5],
  ['--text-muted', '--surface-raised', 4.5],
  ['--on-accent', '--accent', 4.5],
  ['--danger', '--surface-raised', 4.5],
  ['--success', '--surface-raised', 4.5],
]

describe('Design-Tokens', () => {
  it('App.css referenziert nur Tokens, keine Rohfarben (AC1)', () => {
    const appCss = read('./App.css')
    expect(appCss.match(RAW_COLOR) ?? []).toEqual([])
  })

  describe.each([
    ['Light', light],
    ['Dark', dark],
  ])('%s-Kontrast ist WCAG-konform (AC4)', (name, tokens) => {
    it.each(PAIRS)(`%s auf %s ≥ %f:1`, (fg, bg, min) => {
      expect(tokens[fg], `${fg} fehlt im ${name}-Satz`).toBeDefined()
      expect(tokens[bg], `${bg} fehlt im ${name}-Satz`).toBeDefined()
      expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min)
    })
  })
})
