# PROJECT_PLAN — Einkaufsliste (Dark-Factory-Pilot)

> **Zweck dieses Projekts:** Erster Pilot des agenten-basierten Workflows ("Dark Factory").
> Es ist gleichzeitig ein echtes, nützliches Projekt UND das Testfahrzeug für die Pipeline.
> Niedrige Stakes sind Absicht — hier lernen wir, wie autonom die Fabrik läuft, bevor
> Football Manager / MatterMind drankommen.
>
> **Stand:** 2026-07-05 · **Stack:** React + Vite als installierbare PWA
>
> **Autoritativer, eingefrorener MVP-Scope:** [`docs/prd.md`](./docs/prd.md).
> Zukunft: [`ROADMAP.md`](./ROADMAP.md). Agenten-Regeln: [`CLAUDE.md`](./CLAUDE.md).
> Diese Datei bleibt der **Meta-/Pilot-Kontext** (warum, Lernziele) — die Slices selbst
> werden als **GitHub-Issues** (#2–#5) getrackt, nicht mehr als „Häppchen".

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

## MVP-Slices (Details + Scope-Grenzen: `docs/prd.md` + die Issues)

Je Slice = 1 Issue = 1 kleiner PR (Ziel ≤ 200 Zeilen, CI grün = Pflicht):

| Issue | Slice | Status |
|-------|-------|--------|
| #1 | Gerüst + CI + Pages-Deploy ⭐ | ✅ gemerged, live |
| #2 | Item hinzufügen + `localStorage` | offen |
| #3 | Item als erledigt markieren | offen |
| #4 | Item entfernen + umbenennen | offen |
| #5 | Offline + iPhone-Installation | offen |

⭐ **#1 war DEIN Phase-5-Checkpoint** — Fundament + CI-Gate genau angeschaut. Ab #2 sind die
Slices Kandidaten für den autonomen (Cloud-)Lauf.

---

## Leitplanken (aus dem Handoff)

- Kleine PRs (≤ 200 Zeilen), hartes CI-Gate (Tests grün = Pflicht zum Merge).
- **Never-auto-merge-Liste:** Dependency-Updates, CI-/Build-Config-Änderungen, alles was Deploy
  betrifft → immer manuell durch Vincent.
- Bei Sackgassen/Mehrdeutigkeit: Agent fragt nach statt zu raten.
- Review ≠ Self-Review: Ultrareview oder Copilot reviewt, Auto-fix bügelt CI/Kommentare,
  Vincent merged vom iPhone.

## Feature-Roadmap nach MVP

Zukunfts-Features sind bewusst aus dem MVP herausgehalten → siehe [`ROADMAP.md`](./ROADMAP.md).

---

## Pilot-Fortschritt

- ✅ **Setup:** Claude GitHub App, `gh` CLI, Node, `claude.ai/code` verbunden. Repo public.
- ✅ **#1 (Gerüst + CI):** lokal gebaut, PR-Flow + CI + Pages-Deploy end-to-end bewiesen, live.
- ✅ **Issue-Workflow:** MVP-Milestone, Issues #2–#5, PRD/ROADMAP/CLAUDE.md-Guardrails.
- ⏭️ **Nächster echter Fabrik-Test:** **#2** als erster **Cloud-Lauf** (PC-aus, Monitoring am iPhone).

## Woran wir den Cloud-Lauf messen

Quota-Verbrauch pro Slice · Qualität der autonomen Umsetzung · hielt der Agent den Scope
(kein Creep)? · wo musste doch eingegriffen werden? → sagt, ob Pro reicht oder Max nötig
und wie „dark" die Factory realistisch wird.
