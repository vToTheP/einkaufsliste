# PRD — Einkaufsliste (MVP)

> **Eingefrorener MVP-Scope.** Zukunfts-Features stehen in [`../ROADMAP.md`](../ROADMAP.md)
> und sind hier bewusst ausgeschlossen. Diese Trennung ist die zentrale Leitplanke gegen
> Scope-Vermischung — MVP hier, Vision dort.

## Problem / Ziel

Eine einfache, schnelle Einkaufsliste, die auf dem iPhone wie eine App nutzbar ist
(installierbare PWA) und offline funktioniert. Kein Account, keine Einrichtung.

## Zielnutzer

Einzelperson, die unterwegs oder zuhause eine Einkaufsliste führt.

## In Scope (MVP)

| Slice | Fähigkeit | Issue |
|-------|-----------|-------|
| 1 | Gerüst (Vite+React+PWA), CI, Pages-Deploy | #1 |
| 2 | Items hinzufügen + anzeigen, `localStorage` | #2 |
| 3 | Items als erledigt markieren/entmarkieren | #3 |
| 4 | Items entfernen + umbenennen | #4 |
| 5 | Offline-Fähigkeit + Installation auf iPhone | #5 |

> Live-Status der Slices: [Milestone MVP](https://github.com/vToTheP/einkaufsliste/milestone/1)
> — dieses Dokument beschreibt den Scope, nicht den Fortschritt.

## Explizit NICHT im MVP (→ ROADMAP.md)

- Mehrere Listen / Kategorien
- Backend, Accounts, Geräte-Sync
- Bestände / Inventar
- Rezepte, Essenspläne
- Angebote von Läden
- Smart-Home-Integration
- Push-Notifications / Background-Sync

## Erfolgskriterien („MVP fertig")

- Slices #2–#5 gemerged, CI grün.
- App auf iPhone installierbar, offline nutzbar, Items bleiben über Reloads erhalten.

## Constraints

- Nur Frontend (`localStorage`), kein Backend.
- Läuft als statische Seite auf GitHub Pages.
