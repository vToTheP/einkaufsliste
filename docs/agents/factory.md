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
| Cron-Routine | Cloud (`/schedule`) | feuert `factory-run` alle 2 h |
| Review-Routine | Cloud | triggert Ultrareview auf neue Fabrik-PRs |

**Loop-Modell:** Der Durchsatz entsteht **nicht** durch eine Schleife in einer Session,
sondern durch **wiederholtes Cron-Feuern** (alle 2 h = eine eigene, kurze Session pro Slice).
Robust: stirbt eine Feuerung, macht die nächste weiter. Slice-Obergrenze und Zeitfenster
ergeben sich aus dem Cron-Schedule selbst.

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
- **Der unabhängige Reviewer** ist **Ultrareview** (`/code-review ultra <PR>`) — läuft aus dem
  **Pro-Quota-Topf** (keine $-API-Kosten), aber ist **user-getriggert**. Er wird als eigene
  Cloud-Routine/Trigger auf neue Fabrik-PRs eingerichtet (siehe Checkliste). Kein Self-Review.
- ⚠️ **Quota-Konkurrenz:** Ultrareview zieht aus **demselben** Pro-Topf wie die Slices — jeder
  automatische Review kostet Quota, die sonst eine Slice wäre. In die Kalibrierung einrechnen.

## Kalibrierung (empirisch nachziehen)

- Startwert: **~6 % Quota/Slice** (Messwert aus dem Pilot). Effektive Slice-Zahl/Nacht =
  Anzahl der Cron-Feuerungen im Fenster (2 h-Takt).
- Nach ein paar Nächten den **realen** Verbrauch prüfen (Slices **plus** Ultrareview-Anteil)
  und Cron-Takt / PR-Cap nachjustieren.
- **Quota ist von innerhalb einer Session nicht lesbar** (verifiziert gegen die offizielle
  Doku: weder `/usage`/`/cost` maschinenlesbar, noch Session-Token-Summe in der Cloud, noch
  der 5 h-Reset-Zeitpunkt). Deshalb der Zeitfenster-/Cron-Proxy statt eines echten %-Gates.

## Bedienung

- **Fabrik pausieren:** `.factory-paused` anlegen und committen (`touch .factory-paused`),
  auf `main` pushen. Wieder starten: Datei löschen und pushen.
- **Notfall-Drosselung passiert automatisch** über PR-Cap und CI-Guardrail.

## Setup-Checkliste (Cloud-Teile — von Vincent einzurichten)

- [ ] **Cron-Routine** via `/schedule`: alle 2 h, Prompt = `/factory-run`. Ersetzt den alten
      Routine-Prompt, der bei jedem offenen PR abbrach.
- [ ] **Review-Routine**: Trigger für `/code-review ultra <PR>` auf neue Fabrik-PRs
      einrichten. Vorab verifizieren, ob eine Routine Ultrareview überhaupt auslösen darf —
      sonst per PR-Label oder manuell reviewen.
- [ ] Nach den ersten Nächten: Verbrauch messen und Cron-Takt / PR-Cap kalibrieren.

## Projekt 2 & 3 (Replikation)

Dasselbe Muster gilt pro Repo: `factory-run`-Command + `unblock-ready`-Workflow ins Repo,
eigener 2 h-Cron je Projekt. Das projektübergreifende, wiederverwendbare Muster gehört ins
`E:\Projects\factory-playbook\` — nicht in dieses Repo dokumentieren.
