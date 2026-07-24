---
description: Wählt das nächste bereite Issue nach Priorität und setzt es AFK-fertig um (TDD, Scope-treu, kleiner PR)
---

# Nächstes Issue umsetzen

Du setzt genau EIN Issue dieses Repos um. Wähle es selbstständig nach diesen Regeln:

## Auswahllogik

1. Betrachte alle **offenen Issues** mit Label `status:ready`.
2. Schließe Issues aus, die:
   - das Label `status:blocked` tragen, oder
   - im Body ein „Blocked by #N" enthalten, dessen Issue #N noch offen ist, oder
   - bereits einen offenen PR haben, der sie referenziert (`Closes #N`).
3. Wähle aus dem Rest das Issue mit der **höchsten Priorität**: `prio:1` vor `prio:2` vor `prio:3`.
   Bei Gleichstand: die niedrigste Issue-Nummer.
4. **Kein passendes Issue?** Dann stoppe und melde das Ergebnis der Prüfung — starte keine
   Arbeit ohne Issue und erfinde keins.
5. Nenne zu Beginn kurz, welches Issue du gewählt hast und warum.

## Umsetzung

- Es gelten alle Regeln aus `CLAUDE.md` — insbesondere: **nur** den Issue-Scope umsetzen,
  „Nicht Teil dieser Slice" ist bindend, bei Scope-Creep stoppen und Backlog-Issue anlegen,
  bei Mehrdeutigkeit nachfragen statt raten.
- **TDD:** Arbeite nach dem `tdd`-Skill (`.claude/skills/tdd/SKILL.md`) — red → green,
  eine vertikale Slice pro Zyklus, Tests an öffentlichen Seams. **AFK-Anpassung:** Die im
  Skill geforderte Seam-Bestätigung durch den User gilt als erteilt — die zu testenden
  Seams sind durch die **Akzeptanzkriterien des Issues** vorgegeben. Bestehende Tests
  bleiben grün.
- Qualitäts-Gates vor dem Push: `npm run lint`, `npm test`, `npm run build` müssen grün sein.

## Review → Fix (nach Grün, vor dem PR)

Hat der Slice Commits erzeugt, läuft **vor** dem PR ein In-Session-Review über den fertigen
Diff. Das **ersetzt** den früheren `/simplify`-Cleanup-Pass — die Standards-Achse des Reviews
deckt dieselben Smells ab, der Fix-Pass wendet sie an. Ein Mechanismus statt zwei.

### 1. Review (`code-review`)

- Rufe `code-review` mit **Fixpunkt `main`** auf (die Merge-Base des
  Slice-Branches). Der Skill fährt zwei **isolierte Sub-Agenten** parallel:
  - **Standards** — folgt der Code den dokumentierten Repo-Konventionen (Wiederverwendung,
    Vereinfachung, Redundanz, Verschachtelung, Benennung, zusammengehörige Logik)?
  - **Spec** — entspricht der Code dem, was Issue/PRD verlangt (Akzeptanzkriterien,
    „Nicht Teil dieser Slice")?
- **Sub-Agenten wo möglich auf Sonnet** (nicht am Hauptmodell hängen lassen): Review ist
  Sonnet-Arbeit — auch wenn die Slice auf Opus lief —, sonst kostet der Pass ein Vielfaches
  (Kernprinzip 8).

### 2. Fix-Pass

- **Jede Finding gegen den aktuellen Code verifizieren.** Reviews halluzinieren — behandle
  keine Finding als wahr, ohne sie am Diff zu prüfen.
- Nur noch **gültige** Findings fixen, und zwar **minimal**. Den Rest mit **Kurzbegründung**
  überspringen (warum ungültig / bewusst nicht gefixt).
- **Verhalten-neutral bei Standards-Fixes:** Nur *wie* der Code etwas tut, nie *was*. Keine
  neuen Abhängigkeiten. Tests werden **nicht** angepasst, damit ein Fix „passt" — ändert ein
  Standards-Fix ein Testergebnis, ist der Fix falsch, nicht der Test. (Spec-Findings können
  legitim Verhalten ändern — sie decken eine echte Abweichung vom Issue auf.)
- Danach die Qualitäts-Gates **erneut** fahren (`lint`, `test`, `build`). Rot → den
  betreffenden Fix verwerfen und ohne ihn weitermachen. Der Slice ist wichtiger als die Politur.
- **Keine gültige Finding? Tu nichts.** Kein Leer-Commit, keine Kosmetik.
- Der Fix-Pass zählt **nicht** gegen den 200-Zeilen-Richtwert.
- **Halte fest, was gefixt und was übersprungen wurde** — das wird nach dem PR als
  Audit-Kommentar gebraucht.

## PR

- Öffne einen **kleinen, fokussierten PR** gegen `main` (Richtwert ≤ 200 Zeilen) mit
  `Closes #<Nr>` im Body. Übernimm den Abschnitt „Nicht Teil dieser Slice" in die
  PR-Beschreibung.
- **Hänge den Review-Report als EINEN konsolidierten Audit-Kommentar** an den PR (nicht als
  mehrere Kommentare) — für Vincents Morgen-Review nachvollziehbar: je Finding **gefixt**
  (was?) oder **bewusst übersprungen** (Kurzbegründung).

## Architektur-Scan (nach dem PR, issue-only)

Ist der PR offen, läuft ein Architektur-Scan über den Slice — **rein issue-generierend, nie
selbst-umsetzend.** Klare Trennlinie zum Review→Fix-Pass: dessen Findings betreffen den **Diff**
(in scope → in-Session gefixt); Architektur-Findings betreffen die **Struktur** (out of scope →
neues Issue). Ein Deepening im Slice-PR umzusetzen würde CLAUDE.mds Kernregel „Scope-Creep:
STOPP → Backlog-Issue" und die Merge-Policy brechen.

- **Delegiere an einen `Explore`-Sub-Agenten auf Sonnet** (nicht am Hauptmodell hängen lassen —
  Quota, Kernprinzip 8).
- **Nur Schritt 1 („Explore") von `improve-codebase-architecture`** —
  **ohne** dessen HTML-Report (Schritt 2) und **ohne** Grilling-Loop (Schritt 3), die sind
  human-in-the-loop und nicht AFK-tauglich. Vokabular aus `codebase-design`
  exakt nutzen: shallow → deep Modul, **Seam**, **Deletion-Test**, **Locality**, **Leverage**.
- **Scope = nur die im Slice geänderten Dateien** (`git diff --name-only main...HEAD`) — Pococks
  Skill gewichtet selbst kürzlich geänderte Hot-Spots. Keine repetitiven Full-Repo-Scans.
- Suche Deepening-Gelegenheiten: shallow Module (Interface fast so komplex wie Implementierung),
  fehlende Locality (nur für Testbarkeit extrahierte Funktionen, während die echten Bugs im
  Aufruf stecken), über Seams leckende Kopplung, schwer testbare Interfaces. **Deletion-Test**
  auf Verdächtiges anwenden: würde Löschen die Komplexität konzentrieren (gut) oder nur
  verschieben?

### Jede Gelegenheit → Dedup → `triage`-Issue

- **Dedup gegen offene Issues zuerst** (`gh issue list --state open`). Existiert bereits ein
  offenes Issue, das das Finding abdeckt → **kein Duplikat** anlegen (höchstens ein
  referenzierender Kommentar). Sonst ein **neues Issue**.
- Neue Issues bekommen **ausschließlich `triage`** (KI-erstellt, wartet auf menschliche
  Triage) — **nie automatisch `status:ready`**, konform zu CLAUDE.md für autonom erstellte
  Issues. Prio- und Feinlabels vergibt Vincent bei der Triage.
- **Findings werden nie im Slice-PR selbst umgesetzt** — nur als Issue festhalten.
- **Kein Finding / alles bereits als Issue erfasst → still enden.** Kein Leer-Issue, kein
  Kommentar um des Kommentars willen.

## Nach dem PR

- **Aktiviere sofort das PR-Monitoring (Auto-fix / `subscribe_pr_activity`) — nicht fragen,
  machen.** Reagiere selbstständig auf CI-Failures und Review-Kommentare: Ursache
  analysieren, Fix pushen, im PR kurz erklären. Nur bei Mehrdeutigkeit oder
  architektonischen Fragen nachfragen.
- **Reihenfolge ist bindend: erst Fix-Pass (oben) abschließen, dann den Monitor aktivieren.**
  Die In-Session-Findings sind in Schritt „Fix-Pass" bereits abgearbeitet und im
  Audit-Kommentar dokumentiert — der Monitor ist **nur** für später eintreffendes **externes**
  Feedback (CI, Vincent). Aktivierst du ihn vor dem Fix-Pass, behandelt er den eigenen
  Audit-Kommentar als Aufgabe und der Loop dreht sich.
- **Warte das CI-Ergebnis ab, bevor du die Session als fertig betrachtest.** Ein PR mit
  roter CI ist nicht „fertig". Denk daran: Die CI-Umgebung ist frisch — lokal vorhandene
  Artefakte (z.B. `dist/`) existieren dort nicht.
- Fasse kurz zusammen: gewähltes Issue, was umgesetzt wurde, Testabdeckung, was bewusst
  NICHT gemacht wurde. Markiere offene Fragen deutlich, statt sie stillschweigend zu
  entscheiden.
- Nenne dabei **ausdrücklich das Ergebnis des Review→Fix-Passes**: wie viele Findings je
  Achse (Standards/Spec), wie viele als gültig gefixt, wie viele mit Begründung übersprungen —
  und dass der konsolidierte Audit-Kommentar am PR hängt. Solange der Pass neu ist, ist das
  der einzige Weg zu sehen, ob er Nutzen bringt oder nur Quota kostet.
- Nenne ebenso **das Ergebnis des Architektur-Scans**: wie viele Deepening-Gelegenheiten
  gefunden, wie viele als neues `triage`-Issue angelegt (mit Nummern), wie viele als Duplikat
  offener Issues übersprungen — oder dass der Scan still endete.
