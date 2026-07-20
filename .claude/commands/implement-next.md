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

## Cleanup-Pass (nach Grün, vor dem PR)

Hat der Slice Commits erzeugt, räume den eigenen Diff auf, **bevor** der PR aufgeht — ein
frischer Blick auf den fertigen Code findet, was während des TDD-Zyklus unsauber blieb.

- **Delegiere das an einen Subagenten mit Sonnet** (nicht am Hauptmodell hängen lassen):
  Auch wenn die Slice selbst auf Opus lief, ist Aufräumen Sonnet-Arbeit — sonst kostet der
  Pass ein Vielfaches (Kernprinzip 8).
- Nutze `/simplify` bzw. dessen Kriterien: Wiederverwendung, Vereinfachung, Redundanz,
  Verschachtelung, Benennung, zusammengehörige Logik bündeln.
- **Verhalten-neutral — die härteste Regel dieses Schritts:** Nur *wie* der Code etwas tut,
  nie *was* er tut. Keine Feature-, Output- oder Verhaltensänderung. Keine neuen
  Abhängigkeiten. Tests werden **nicht** angepasst, damit ein Refactor „passt" — ändert der
  Cleanup ein Testergebnis, ist der Cleanup falsch, nicht der Test.
- Danach die Qualitäts-Gates **erneut** fahren (`lint`, `test`, `build`). Rot → Cleanup
  verwerfen (`git revert`/zurücknehmen) und ohne ihn weitermachen. Der Slice ist wichtiger
  als die Politur.
- **Ist der Code bereits sauber, tu nichts.** Kein Leer-Commit, keine Kosmetik um der
  Kosmetik willen.
- Der Cleanup zählt **nicht** gegen den 200-Zeilen-Richtwert.

## PR

- Öffne einen **kleinen, fokussierten PR** gegen `main` (Richtwert ≤ 200 Zeilen) mit
  `Closes #<Nr>` im Body. Übernimm den Abschnitt „Nicht Teil dieser Slice" in die
  PR-Beschreibung.

## Nach dem PR

- **Aktiviere sofort das PR-Monitoring (Auto-fix / `subscribe_pr_activity`) — nicht fragen,
  machen.** Reagiere selbstständig auf CI-Failures und Review-Kommentare: Ursache
  analysieren, Fix pushen, im PR kurz erklären. Nur bei Mehrdeutigkeit oder
  architektonischen Fragen nachfragen.
- **Signiere jede eigene PR-Äußerung** (PR-Body, Kommentare, Thread-Antworten) mit dieser
  letzten Zeile:
  ```
  <!-- factory-autofix -->
  ```
  Der Grund: Die Cloud-Session ist als `vToTheP` authentifiziert — dieselbe Identität wie
  Vincent. Ohne Marker kann eine **spätere** Feuerung nicht unterscheiden, ob das letzte
  Wort auf einem PR von einem Reviewer oder vom Agenten selbst stammt. Genau darauf stützt
  sich die Rückstands-Erkennung in `/factory-run` (Gate-Schritt 4). Fehlt der Marker, gilt
  der eigene Kommentar als offenes Feedback und die Fabrik dreht sich im Kreis.
- **Warte das CI-Ergebnis ab, bevor du die Session als fertig betrachtest.** Ein PR mit
  roter CI ist nicht „fertig". Denk daran: Die CI-Umgebung ist frisch — lokal vorhandene
  Artefakte (z.B. `dist/`) existieren dort nicht.
- Fasse kurz zusammen: gewähltes Issue, was umgesetzt wurde, Testabdeckung, was bewusst
  NICHT gemacht wurde. Markiere offene Fragen deutlich, statt sie stillschweigend zu
  entscheiden.
- Nenne dabei **ausdrücklich das Ergebnis des Cleanup-Passes**: aufgeräumt (was?), nichts
  zu tun, oder verworfen (warum?). Solange der Pass neu ist, ist das der einzige Weg zu
  sehen, ob er Nutzen bringt oder nur Quota kostet.
