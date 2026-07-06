// @vitest-environment node
// (esbuild/vite build brauchen echte Node-Globals, nicht jsdom)
import { build } from 'vite'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const outDir = resolve(root, 'dist-pwa-test')

// Integrations-Test: der Produktions-Build muss eine offline-fähige App-Shell
// erzeugen (Service Worker + Precache) und den SW registrieren. Baut in ein
// eigenes outDir, um das echte dist/ nicht anzufassen.
describe('PWA-Build (offline-fähige App-Shell)', () => {
  beforeAll(async () => {
    await build({ root, logLevel: 'silent', build: { outDir, emptyOutDir: true } })
  }, 60000)

  afterAll(() => {
    rmSync(outDir, { recursive: true, force: true })
  })

  it('erzeugt einen Service Worker', () => {
    expect(existsSync(resolve(outDir, 'sw.js'))).toBe(true)
  })

  it('registriert den Service Worker aus der index.html', () => {
    const html = readFileSync(resolve(outDir, 'index.html'), 'utf8')
    expect(html).toMatch(/registerSW\.js/)
  })

  it('precached die App-Shell (index.html + JS-Bundle)', () => {
    const sw = readFileSync(resolve(outDir, 'sw.js'), 'utf8')
    expect(sw).toMatch(/index\.html/)
    expect(sw).toMatch(/assets\/index-.*\.js/)
  })

  it('gibt ein Web-App-Manifest aus', () => {
    expect(existsSync(resolve(outDir, 'manifest.webmanifest'))).toBe(true)
  })
})
