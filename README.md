# einkaufsliste

Einkaufslisten-App als installierbare **PWA** (React + Vite). Erster Pilot eines
agenten-basierten Entwicklungs-Workflows ("Dark Factory").

- **Plan & Scope:** siehe [`PROJECT_PLAN.md`](./PROJECT_PLAN.md)
- **Stack:** React + Vite, ausgeliefert als PWA (auf dem iPhone via „Zum Home-Bildschirm" installierbar)
- **MVP-Persistenz:** `localStorage` (kein Backend)
- **CI/Deploy:** GitHub Actions → GitHub Pages

## Entwicklung

```bash
npm install
npm run dev      # lokaler Dev-Server
npm test         # Vitest
npm run lint     # ESLint
npm run build    # Produktions-Build (nach dist/)
```

## Status

✅ Häppchen 1: Gerüst (Vite + React + PWA), CI (lint/test/build) und
Pages-Deploy stehen. Nächster Schritt: Häppchen 2 (Items hinzufügen + `localStorage`).
