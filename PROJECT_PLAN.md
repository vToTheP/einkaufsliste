# PROJECT_PLAN — Einkaufsliste (Dark-Factory-Pilot)

> **Zweck dieses Projekts:** Erster Pilot des agenten-basierten Workflows ("Dark Factory").
> Es ist gleichzeitig ein echtes, nützliches Projekt UND das Testfahrzeug für die Pipeline.
> Niedrige Stakes sind Absicht — hier lernen wir, wie autonom die Fabrik läuft, bevor
> Football Manager / MatterMind drankommen.
>
> **Stand:** 2026-07-02 · **Stack entschieden:** React + Vite als installierbare PWA

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

## MVP = eine teilbare Einkaufsliste, auf dem iPhone als PWA installierbar

Zerlegt in PR-große Häppchen (Ziel: je ≤ 200 Zeilen, je 1 PR, CI grün = Pflicht):

| # | Häppchen | Inhalt |
|---|----------|--------|
| **1** | **Gerüst + CI** ⭐ | Vite+React-Setup, PWA-Manifest + Service-Worker-Grundgerüst, „leere Liste"-Ansicht, GitHub Actions (lint/test/build), Deploy auf GitHub Pages. |
| 2 | Item hinzufügen | Eingabefeld + Liste rendern, State-Management, `localStorage`-Persistenz. |
| 3 | Item abhaken | Item als erledigt markieren/entmarkieren (visuell + persistiert). |
| 4 | Item bearbeiten/löschen | Editieren + Entfernen einzelner Items. |
| 5 | Offline + Install | Service Worker fertig (Offline-Nutzung), „Zum Home-Bildschirm" auf iPhone verifiziert. |

⭐ **Häppchen 1 ist DEIN Phase-5-Checkpoint** — die eine Stelle, die du bewusst genau anschaust:
Fundament + CI-Gate müssen sitzen, sonst potenziert sich jeder spätere Fehler. Alles ab
Häppchen 2 ist Kandidat für den autonomen (Cloud-)Lauf.

---

## Leitplanken (aus dem Handoff)

- Kleine PRs (≤ 200 Zeilen), hartes CI-Gate (Tests grün = Pflicht zum Merge).
- **Never-auto-merge-Liste:** Dependency-Updates, CI-/Build-Config-Änderungen, alles was Deploy
  betrifft → immer manuell durch Vincent.
- Bei Sackgassen/Mehrdeutigkeit: Agent fragt nach statt zu raten.
- Review ≠ Self-Review: Ultrareview oder Copilot reviewt, Auto-fix bügelt CI/Kommentare,
  Vincent merged vom iPhone.

## Feature-Roadmap nach MVP (grob, je eigene Pipeline-Runde)

1. Mehrere Listen / Kategorien.
2. Kleines Backend + Geräte-Sync (Stack dann wählen: Node oder Java).
3. Bestände von Items tracken.
4. Rezepte + wöchentliche Essenspläne → generieren Einkaufsliste.
5. Angebote von Läden einbeziehen.
6. Smart-Home-Integration.

---

## Nächste Schritte

1. **Setup (~5 Min, Vincent):** `claude.ai/code` aktivieren + Claude GitHub App installieren.
2. **Lokal (jetzt):** Häppchen 1 umsetzen (Gerüst + CI) — der Checkpoint zum Draufschauen.
3. Häppchen 2 → erster **Cloud-Lauf** (läuft bei PC-aus, Monitoring am iPhone).
4. **Messen:** Quota-Verbrauch/Häppchen, Qualität der autonomen Umsetzung, Eingriffs-Stellen.
