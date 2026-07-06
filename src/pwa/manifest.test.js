import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'
import { createManifest } from './manifest.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

describe('PWA-Manifest (Installierbarkeit)', () => {
  const base = '/einkaufsliste/'
  const manifest = createManifest(base)

  it('startet im Standalone-Modus', () => {
    expect(manifest.display).toBe('standalone')
  })

  it('verankert start_url und scope an der Base', () => {
    expect(manifest.start_url).toBe(base)
    expect(manifest.scope).toBe(base)
  })

  it('hat einen Namen und einen kurzen Home-Bildschirm-Namen', () => {
    expect(manifest.name).toBeTruthy()
    expect(manifest.short_name).toBeTruthy()
    expect(manifest.short_name.length).toBeLessThanOrEqual(12)
  })

  it('liefert 192px-, 512px- und ein maskable-Icon', () => {
    const sizes = manifest.icons.map((icon) => icon.sizes)
    expect(sizes).toContain('192x192')
    expect(sizes).toContain('512x512')
    expect(manifest.icons.some((icon) => icon.purpose === 'maskable')).toBe(true)
  })

  it('setzt Theme- und Hintergrundfarbe', () => {
    expect(manifest.theme_color).toMatch(/^#[0-9a-f]{6}$/i)
    expect(manifest.background_color).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('index.html (iPhone-Installierbarkeit)', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8')

  it('markiert die App als iOS-standalone-fähig', () => {
    expect(html).toMatch(/name="apple-mobile-web-app-capable"\s+content="yes"/)
  })

  it('setzt einen Titel für den Home-Bildschirm', () => {
    expect(html).toMatch(/name="apple-mobile-web-app-title"/)
  })

  it('verweist auf ein apple-touch-icon', () => {
    expect(html).toMatch(/rel="apple-touch-icon"/)
  })
})
