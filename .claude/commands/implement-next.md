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
- **TDD:** Schreibe zuerst Tests für die Akzeptanzkriterien des Issues, dann die Implementierung.
  Bestehende Tests bleiben grün.
- Qualitäts-Gates vor dem Push: `npm run lint`, `npm test`, `npm run build` müssen grün sein.
- Öffne einen **kleinen, fokussierten PR** gegen `main` (Richtwert ≤ 200 Zeilen) mit
  `Closes #<Nr>` im Body. Übernimm den Abschnitt „Nicht Teil dieser Slice" in die
  PR-Beschreibung.

## Nach dem PR

Fasse kurz zusammen: gewähltes Issue, was umgesetzt wurde, Testabdeckung, was bewusst
NICHT gemacht wurde. Markiere offene Fragen deutlich, statt sie stillschweigend zu entscheiden.
