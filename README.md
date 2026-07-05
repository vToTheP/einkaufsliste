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
```

## Status

✅ #1 Gerüst (Vite + React + PWA), CI (lint/test/build) und Pages-Deploy stehen.
Live: https://vtothep.github.io/einkaufsliste/ · Offene MVP-Slices: #2–#5.
