# einkaufsliste

Einkaufslisten-App als installierbare **PWA** (React + Vite). Erster Pilot eines
agenten-basierten Entwicklungs-Workflows ("Dark Factory").

- **MVP-Scope (eingefroren):** [`docs/prd.md`](./docs/prd.md) · **Zukunft:** [`ROADMAP.md`](./ROADMAP.md)
- **Arbeitsanweisungen für Agenten:** [`CLAUDE.md`](./CLAUDE.md) · **Meta/Pilot-Kontext:** [`PROJECT_PLAN.md`](./PROJECT_PLAN.md)
- **Stack:** React + Vite, ausgeliefert als PWA (auf dem iPhone via „Zum Home-Bildschirm" installierbar)
- **MVP-Persistenz:** `localStorage` (kein Backend)
- **CI/Deploy:** GitHub Actions → GitHub Pages

## Arbeitsweise

Issue-getrieben: jede Slice = ein Issue (Template „Vertikale Slice") = ein kleiner PR
(`Closes #N`). Scope-Grenzen (MVP vs. Zukunft) sind in `docs/prd.md` / `ROADMAP.md`
festgeschrieben; `CLAUDE.md` hält Agenten an diese Grenzen.

## Entwicklung

```bash
npm install
npm run dev      # lokaler Dev-Server
npm test         # Vitest
npm run lint     # ESLint
npm run build    # Produktions-Build (nach dist/)
npm run test:e2e # Playwright-E2E + visuelle Regressionstests
```

### Visuelle Regressionstests

`e2e/visual.spec.js` vergleicht Screenshots der Hauptansichten (leere Liste ·
Liste mit Items · Item erledigt) gegen eingecheckte Referenzbilder unter
`e2e/visual.spec.js-snapshots/`. Weicht das Rendering ab, wird die CI rot und
lädt die `expected/actual/diff`-Bilder als Artifact **`playwright-diffs`** hoch.

Damit das Font-Rendering deterministisch ist, laufen die E2E-Tests in der CI im
offiziellen Playwright-Container (`mcr.microsoft.com/playwright:v1.56.1-noble`).
**Referenzbilder müssen im selben Image erzeugt werden**, sonst weichen sie ab.

Bei **gewollten** UI-Änderungen die Referenzen im Container neu erzeugen und
committen (Version muss zu `@playwright/test` in `package.json` passen):

```bash
docker run --rm -v "$PWD":/work -w /work \
  mcr.microsoft.com/playwright:v1.56.1-noble \
  bash -c "npm ci && npm run build && npm run test:e2e:update"
```

`npm run test:e2e:update` (= `playwright test --update-snapshots`) allein
aktualisiert die Bilder lokal, erzeugt aber Rendering, das von der CI abweichen
kann — für eingecheckte Referenzen daher immer den Container-Weg nutzen.

## Status

**Live:** https://vtothep.github.io/einkaufsliste/ (Deploy bei jedem Merge auf `main`)

Der aktuelle Arbeitsstand steht **nicht** hier (Docs veralten), sondern in GitHub:
[Milestone MVP](https://github.com/vToTheP/einkaufsliste/milestone/1) ·
[offene Issues](https://github.com/vToTheP/einkaufsliste/issues) ·
[offene PRs](https://github.com/vToTheP/einkaufsliste/pulls)
