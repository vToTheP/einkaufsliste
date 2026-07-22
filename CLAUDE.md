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

## Issue-Auswahl & Labels

- `status:ready` = bereit zur AFK-Umsetzung · `status:blocked` = wartet (siehe „Blocked by #N" im Body)
- Priorität: `prio:1` > `prio:2` > `prio:3`. Agenten wählen Issues nur über den Command
  `/implement-next` (`.claude/commands/implement-next.md`) — nie eigenmächtig.
- **Autonom** vom Cloud-Agent (ohne menschliches Beisein) erstellte Issues bekommen immer
  ein `triage`-Label und nie automatisch `status:ready`. Bekannte Fälle: Bug-Issues aus
  Webhook/Error-Reporting, Auto-Eval aus User-Feedback, PR-Kommentar-Sammelissues (ab der
  2. Review-Iteration). **Interaktiv gemeinsam mit Vincent** erstellte Issues (z.B. via
  `/to-issues`) werden dagegen direkt korrekt gelabelt: unblockt → `status:ready`,
  blockiert → `status:blocked`.
- **Blocker-Ketten: die Wurzel ist NIE `status:blocked`.** Legst du mehrere aufeinander
  aufbauende Issues an (z.B. Design-Slices A → B → C), gilt die Label-Regel pro Issue: das
  Wurzel-Issue hat keine `#N`-Blocker („## Blocked by: Keine") und bekommt deshalb
  `status:ready` (bzw. `triage` bei autonomer Anlage) — **nicht** `status:blocked`. Nur
  Issues mit mindestens einem offenen `#N`-Blocker sind `status:blocked`. Wird die ganze
  Kette pauschal blockiert gelabelt, verhungert die Fabrik (kein ready-Issue → siehe #100).
  Als Sicherheitsnetz hebt `.github/workflows/unblock-ready.yml` ein `status:blocked`-Issue,
  dessen „## Blocked by" keine `#N`-Referenz enthält, automatisch auf `status:ready`.

## Vertikale Slices

Jedes Issue liefert eine dünne End-to-End-Fähigkeit (Eingabe → State → Persistenz → Anzeige),
keine horizontale Schicht.

## Qualitäts-Gates (vor jedem Push)

- `npm run lint`, `npm test`, `npm run build` müssen grün sein.
- **`npm ci` statt `npm install`**, solange du keine Dependencies änderst — `npm install`
  formatiert das Lockfile je nach npm-Version um und erzeugt themenfremdes Diff-Rauschen
  im PR. Lockfile-Änderungen gehören nur in PRs, die bewusst Dependencies ändern.
- Kleine, fokussierte PRs. Richtwert ≤ 200 geänderte Zeilen (generierte Dateien wie
  Lockfiles/Snapshots zählen nicht). **Das ist eine Planungs-Grenze, keine Qualitäts-Grenze:**
  - Absehbar deutlich drüber? → Erst prüfen, ob sich das Issue in kleinere Slices teilen
    lässt, und die Teilung als neue Issues vorschlagen — statt alles in einen PR zu packen.
  - Slice nicht sinnvoll teilbar? → Richtwert überschreiten und kurz im PR begründen.
    Tests, Fehlerbehandlung und Lesbarkeit werden **nie** gekürzt, um eine Zeilenzahl
    zu treffen. Qualität gewinnt immer.
- Jeder PR referenziert sein Issue: `Closes #N`.

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

## Agent skills

### Issue tracker

Issues and PRDs live as GitHub issues, managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root (created lazily). See `docs/agents/domain.md`.
