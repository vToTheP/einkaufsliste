# CLAUDE.md — Arbeitsanweisungen für dieses Repo

Einkaufslisten-PWA (React + Vite). Erster Pilot eines agenten-basierten Workflows.
Diese Datei wird bei jeder lokalen **und** Cloud-Session geladen und ist bindend.

## Scope-Disziplin (wichtigste Regel)

- **`docs/prd.md`** definiert den **eingefrorenen MVP-Scope**. Nur was dort unter
  „In Scope" steht, wird umgesetzt.
- **`ROADMAP.md`** listet Zukunfts-Features. Diese sind **nicht** Teil des MVP und werden
  **nicht** implementiert, solange sie kein eigenes Issue in einem geplanten Milestone haben.
- **Issue-getrieben arbeiten:** Setze ausschließlich den Scope des referenzierten Issues um.
  Der Abschnitt **„Nicht Teil dieser Slice"** im Issue ist bindend.
- **Bei Scope-Creep: STOPP.** Wenn dir Arbeit auffällt, die zu einem Zukunfts-Feature oder
  einem anderen Issue gehört, baue sie **nicht** vor. Lege stattdessen ein neues Backlog-Issue
  an (oder notiere es klar im PR) und bleib beim eigentlichen Scope.
- **Bei Mehrdeutigkeit / Sackgasse:** nicht raten. Kurz nachfragen bzw. die offene Frage im
  PR/Issue festhalten, statt eine Richtung zu erfinden.

## Vertikale Slices

Jedes Issue liefert eine dünne End-to-End-Fähigkeit (Eingabe → State → Persistenz → Anzeige),
keine horizontale Schicht.

## Qualitäts-Gates (vor jedem Push)

- `npm run lint`, `npm test`, `npm run build` müssen grün sein.
- Kleine, fokussierte PRs (Richtwert ≤ 200 Zeilen). Jeder PR referenziert sein Issue: `Closes #N`.

## Never-auto-merge

Dependency-Updates, CI-/Build-Config, Deploy-Änderungen → immer manueller Review + Merge
durch Vincent (nie autonom mergen).

## Dev-Befehle

```bash
npm install
npm run dev      # lokaler Dev-Server
npm test         # Vitest
npm run lint     # ESLint
npm run build    # Produktions-Build (nach dist/)
```

## Tech-Kurzüberblick

- React 18 + Vite 6, PWA via `vite-plugin-pwa`
- Persistenz: `localStorage` (kein Backend im MVP)
- Deploy: GitHub Actions → GitHub Pages (`base` = `/einkaufsliste/`)
