# Nacht-Fabrik: Betrieb

Wie die AFK-Fabrik dieses Repos nachts autonom Slices abarbeitet. Ziel: die **Quota**
maximal ausnutzen (Engpass = Quota, nicht Vincents Review-Kapazität). Ein morgendlicher
Stapel unreviewter PRs ist explizit akzeptiert. Der Kontext dazu steht in Issue #53.

## Überblick

Die Fabrik besteht aus drei Teilen — zwei im Repo (versioniert), einer in der Cloud:

| Teil | Wo | Was |
|---|---|---|
| `factory-run` | `.claude/commands/factory-run.md` | Vorab-Gate + Start **einer** Slice |
| Nachschub-Automatik | `.github/workflows/unblock-ready.yml` | hebt abhängige Issues nach Merge auf `status:ready` |
| Cron-Routine | Cloud (`/schedule`) | feuert `factory-run` alle 6 h |
| Review-Routine | Cloud | triggert Ultrareview auf neue Fabrik-PRs |

**Loop-Modell:** Der Durchsatz entsteht **nicht** durch eine Schleife in einer Session,
sondern durch **wiederholtes Cron-Feuern** (aktuell **alle 6 h** = eine eigene, kurze Session
pro Slice). Robust: stirbt eine Feuerung, macht die nächste weiter. Slice-Obergrenze und
Zeitfenster ergeben sich aus dem Cron-Schedule selbst.

**Warum 6 h (Stand 2026-07-19, konservativer Startwert):** Der Quota-Topf ist geteilt —
Slices **plus** Ultrareview-Reviews **plus** parallele Projekte 2 & 3 ziehen alle aus
demselben ~5 h-Fenster. Ein 6 h-Takt (> 5 h-Reset) stellt sicher, dass **pro Projekt höchstens
eine Slice pro Reset-Fenster** landet — sicher gegen Überziehen, solange der reale Verbrauch
noch nicht messbar ist. Sobald wir den Verbrauch messbar machen (s. Kalibrierung), kann der
Takt wieder verdichtet werden.

## Gate (was `factory-run` prüft, bevor eine Slice startet)

1. **Pause / Not-Aus** — existiert die Datei `.factory-paused` im Repo-Root, stoppt die
   Feuerung sofort ohne Slice.
2. **PR-Cap** — sind **≥ 10 offene Nicht-Bot-PRs** da, wird gedrosselt (warten auf Merges).
   **Dependabot-/Bot-PRs zählen nie** mit.
3. **CI-Guardrail** — sind **≥ 3 offene Nicht-Bot-PRs mit fehlgeschlagener CI**, wird
   gestoppt (kein Quota-Verbrennen in kaputtem Zustand). Pending-Checks zählen nicht als rot.
4. Sonst → `/implement-next` (nächstes `status:ready`-Issue nach Priorität, TDD, kleiner PR,
   Auto-fix-Monitoring). Kein Ready-Issue → sauberer Stopp.

**Never-auto-merge bleibt:** Die Fabrik öffnet nur PRs und merged nie. Mergen bleibt bei Vincent.

## Review-Zyklus

- **Auto-fix läuft schon** (nativ, aktiviert in `/implement-next`): reagiert auf
  Review-Kommentare + CI-Failures, pusht Fixes, antwortet, resolved.
- **Reviewer = Ultrareview, MANUELL durch Vincent beim Merge** (`/code-review ultra <PR>`,
  Pro-Quota-Topf, keine $-API-Kosten). Kein Self-Review.
- ❌ **Getestet & verworfen (2026-07-20): Cron-getriggerte Ultrareview geht NICHT.** Eine
  Cloud-/Routine-Session kann `/code-review ultra` nicht ausführen — das Command ist dort
  nicht verfügbar und bietet nur einen lokalen Fallback an. Eine dedizierte Review-Routine
  wurde daher wieder deaktiviert. Automatisierter, unabhängiger Reviewer bleibt offen;
  Kandidaten: **GitHub Copilot Review** (~$10/mo flat, kein Quota, voll automatisch) oder
  eine **Claude-Action auf PR-Event** (API-Key → $-Kosten). Bis dahin: manuell beim Merge.

## Kalibrierung (empirisch nachziehen)

- Startwert: **~6 % Quota/Slice** (Messwert aus dem Pilot). Effektive Slice-Zahl je Fenster =
  Anzahl der Cron-Feuerungen (aktuell 6 h-Takt → ~1 Slice pro Projekt pro Reset).
- Nach ein paar Nächten den **realen** Verbrauch prüfen (Slices **plus** Ultrareview-Anteil
  **plus** Last der anderen Projekte) und Cron-Takt / PR-Cap nachjustieren.
- **Nächster großer Schritt: Quota-Verbrauch messbar machen.** Ohne Messung ist der 6 h-Takt
  nur ein konservativer Schätzwert. Optionen zu prüfen (extern, da session-intern nicht
  lesbar): OTEL-Export in ein Observability-Backend oder die Usage-&-Cost-Admin-API
  (Org-Level, ~5 min Latenz, Admin-Key). Ziel: den Takt datenbasiert verdichten, statt zu raten.
- **Quota ist von innerhalb einer Session nicht lesbar** (verifiziert gegen die offizielle
  Doku: weder `/usage`/`/cost` maschinenlesbar, noch Session-Token-Summe in der Cloud, noch
  der 5 h-Reset-Zeitpunkt). Deshalb der Zeitfenster-/Cron-Proxy statt eines echten %-Gates.

## Bedienung

- **Fabrik pausieren:** `.factory-paused` anlegen und committen (`touch .factory-paused`),
  auf `main` pushen. Wieder starten: Datei löschen und pushen.
- **Notfall-Drosselung passiert automatisch** über PR-Cap und CI-Guardrail.
- **Visuelle Snapshots nach UI-Änderungen:** Intendierte UI-Änderungen brechen die
  Playwright-Baselines (`e2e/**/*-chromium-linux.png`) — die Fabrik kann das nicht selbst
  grün bekommen (Baselines nur im chromium-linux-Container erzeugbar). Fix: Workflow
  **„Update visual snapshots"** (`.github/workflows/update-snapshots.yml`) manuell auf dem
  PR-Branch auslösen (Actions → Workflow → Branch angeben). Er regeneriert die Baselines im
  Container und committet sie zurück. Setzt das Secret `SNAPSHOT_PUSH_TOKEN` voraus (s.
  Checkliste), sonst triggert der Push die e2e-CI nicht neu.

## Setup-Checkliste (Cloud-Teile — von Vincent einzurichten)

- [ ] **Cron-Routine** via `/schedule`: alle 6 h, Prompt = `/factory-run`. Ersetzt den alten
      Routine-Prompt, der bei jedem offenen PR abbrach. (Takt bewusst konservativ, s. „Warum 6 h".)
- [x] ~~Review-Routine für `/code-review ultra`~~ — **verworfen**: Cron kann Ultrareview
      nicht auslösen (s. Review-Zyklus). Review bleibt vorerst manuell beim Merge.
- [ ] **Secret `SNAPSHOT_PUSH_TOKEN`** anlegen (Fine-grained PAT, Contents: Read/Write) —
      damit der „Update visual snapshots"-Workflow pushen kann und die CI erneut triggert.
- [ ] Nach den ersten Nächten: Verbrauch messen und Cron-Takt / PR-Cap kalibrieren.

## Projekt 2 & 3 (Replikation)

Dasselbe Muster gilt pro Repo: `factory-run`-Command + `unblock-ready`-Workflow ins Repo,
eigener 6 h-Cron je Projekt (versetzt getaktet, damit sich die Projekte im geteilten Quota-Topf
nicht überlagern). Das projektübergreifende, wiederverwendbare Muster gehört ins
`E:\Projects\factory-playbook\` — nicht in dieses Repo dokumentieren.
