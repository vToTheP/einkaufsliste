# PROJECT_PLAN — Einkaufsliste (Dark-Factory-Pilot)

> **Zweck dieses Projekts:** Erster Pilot des agenten-basierten Workflows ("Dark Factory").
> Es ist gleichzeitig ein echtes, nützliches Projekt UND das Testfahrzeug für die Pipeline.
> Niedrige Stakes sind Absicht — hier lernen wir, wie autonom die Fabrik läuft, bevor
> Football Manager / MatterMind drankommen.
>
> **Stand:** 2026-07-06 · **Stack:** React + Vite als installierbare PWA
>
> **Rollen der Dokumente:** [`docs/prd.md`](./docs/prd.md) = eingefrorener MVP-Scope ·
> [`ROADMAP.md`](./ROADMAP.md) = Zukunft · [`CLAUDE.md`](./CLAUDE.md) = Agenten-Regeln ·
> **GitHub Issues/Milestone** = Live-Status · diese Datei = **Pilot-Journal**
> (warum es dieses Projekt gibt, was die Fabrik beweisen soll, Messergebnisse).

---

## Vision (langfristig)

Eine Einkaufslisten-App, die schrittweise „smart" wird und sich ins Smart Home integriert:
Angebote von Läden, Rezepte + wöchentliche Essenspläne, Bestände von Items. Start bewusst
minimal, jede Ausbaustufe = eigene Feature-Runde durch die Pipeline.

## Stack & Warum

- **React + Vite**, ausgeliefert als **PWA** (Manifest + Service Worker) → auf dem iPhone via
  Safari „Zum Home-Bildschirm" als echte App installierbar. Kein App Store, kein Mac nötig
  (wichtig: Entwicklung auf Windows 10).
- **Persistenz MVP:** `localStorage` (kein Backend). Backend kommt erst mit den Smart-Features.
- **CI/Deploy:** GitHub Actions (Lint + Test + Build) → Deploy auf GitHub Pages (gratis).

## Nicht-Ziele im MVP (bewusst raus)

- Kein Backend, kein Multi-User-Sync, kein Login.
- Keine Smart-Features (Angebote / Rezepte / Essenspläne / Bestände) — spätere Feature-Stufen.
- Keine native App / kein App Store.

---

## MVP-Slices

Je Slice = 1 Issue = 1 kleiner PR (CI grün = Pflicht). Scope: `docs/prd.md`.
Live-Status: [Milestone MVP](https://github.com/vToTheP/einkaufsliste/milestone/1).

**#1 (Gerüst + CI) war der Phase-5-Checkpoint** — Fundament + CI-Gate bewusst manuell
gebaut und genau angeschaut. Alle weiteren Slices laufen autonom durch die Fabrik.

---

## Leitplanken (aus dem Handoff)

- Kleine PRs (≤ 200 Zeilen), hartes CI-Gate (Tests grün = Pflicht zum Merge).
- **Merge-Policy nach Risiko-Tiers** (Reversibilität × CI-Blindheit, siehe `CLAUDE.md`): CI-blinde
  oder schwer reversible Änderungen (Workflows/CI-Config, Deploy, `src/db/**`-Schema,
  `src/pwa/**`-Service-Worker, Dependency-Majors) → Tier HUMAN, immer manuell durch Vincent; der
  Rest ist bei grüner CI Fast-Merge. Aktuell merged Vincent weiterhin alles von Hand.
- Bei Sackgassen/Mehrdeutigkeit: Agent fragt nach statt zu raten.
- Review ≠ Self-Review: Ultrareview oder Copilot reviewt, Auto-fix bügelt CI/Kommentare,
  Vincent merged vom iPhone.

## Feature-Roadmap nach MVP

Zukunfts-Features sind bewusst aus dem MVP herausgehalten → siehe [`ROADMAP.md`](./ROADMAP.md).

---

## Pilot-Journal: was die Fabrik bisher bewiesen hat

- ✅ **Setup (2026-07-03):** Claude GitHub App, `gh` CLI, Node, `claude.ai/code` verbunden.
- ✅ **#1 Gerüst + CI (2026-07-03):** lokal gebaut, PR-Flow + CI + Pages-Deploy end-to-end, live.
- ✅ **Issue-Workflow (2026-07-05):** MVP-Milestone, Issues, PRD/ROADMAP/CLAUDE.md-Guardrails.
- ✅ **Erster AFK-Cloud-Lauf (2026-07-05, Issue #2):** autonom, scope-treu dank CLAUDE.md,
  **~6% Session-Quota** pro Slice. PC aus, Monitoring am iPhone.
- ✅ **Ein-Befehl-Start (2026-07-06, Issue #3):** `/implement-next` wählt das Issue selbst
  (Prio/Ready/Blocked), TDD nach `tdd`-Skill sichtbar red→green, wieder ~6% Session /
  ~1% Wochen-Quota. **Fazit: Pro-Plan trägt diese Kadenz locker.**
- ✅ **Selbstkorrektur der Fabrik (2026-07-06):** Review-Finding aus PR #10 (Lockfile-Rauschen
  durch `npm install` auf der Cloud-VM) → neue `npm ci`-Regel in CLAUDE.md.
- ✅ **MVP SHIPPED (2026-07-06):** #4 und #5 ebenfalls voll autonom (Cloud, `/implement-next`),
  Milestone geschlossen, PWA live inkl. Offline- und iOS-Install-Support. **Alle 4 Fach-Slices
  (#2–#5) ohne manuellen Code-Eingriff** — Vincents Rolle: Review + Merge.
  Nebenbei gelernt: Desktop-App-Sessions laufen lokal (Permission-Prompts, kein AFK) —
  Fabrik-Läufe immer als Cloud-Session starten. Ein Pages-Deploy schlug transient fehl
  („try again later"), Folge-Deploy grün — unkritisch.

## Messpunkte für weitere Läufe

Quota-Verbrauch pro Slice · Scope-Treue (kein Creep) · TDD-Qualität · wo musste eingegriffen
werden? → kalibriert, wie „dark" die Factory wird und wann Max statt Pro nötig wäre.

## Prozess-Ausbaustufen (nach MVP)

Playwright-QA in CI (inkl. visueller Tests) · Ultrareview/Copilot-Review-Stufe ·
Design-AFK via `needs:design`-Label + Routine · Nacht-Routine für `/implement-next` ·
Auto-Issues aus Fehler-Tracking (erst mit Backend). Details: Memory/Session-Historie.
