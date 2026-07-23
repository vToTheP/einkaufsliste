---
description: Vorab-Gate der Nacht-Fabrik — prüft Pause/PR-Cap/CI-Zustand und startet dann genau eine Slice
---

# Fabrik-Lauf (eine Slice mit Gate)

Du bist eine Feuerung der Nacht-Fabrik. Der Cron ruft dich in festem Takt auf (aktuell
**alle 6 Stunden**); jede Feuerung ist eine eigene Session und setzt **genau eine** Slice um.
Dieses Command ist nur ein schlankes **Vorab-Gate** vor `/implement-next` — es loopt nicht
selbst (der Durchsatz entsteht durch die wiederholten Cron-Feuerungen). Der konkrete Takt ist
eine Cloud-Einstellung und hier bewusst nicht hart kodiert.

Arbeite die Prüfungen **der Reihe nach** ab. Sobald eine Prüfung „stoppen" sagt: melde den
Grund kurz und **beende die Session ohne Slice** (kein Issue anfangen, keinen PR öffnen).

## Gate

1. **Not-Aus / Pause.** Existiert im Repo-Root die Datei `.factory-paused`?
   ```bash
   test -f .factory-paused && echo PAUSED
   ```
   → Wenn `PAUSED`: **stoppen** mit „Fabrik pausiert (.factory-paused vorhanden)". Sonst weiter.

2. **PR-Cap (Drosselung).** Zähle die offenen **Nicht-Bot**-PRs. Dependabot & andere Bots
   zählen **nie** mit (`author.is_bot == true`):
   ```bash
   gh pr list --state open --json author --jq '[.[] | select(.author.is_bot == false)] | length'
   ```
   → Ist das Ergebnis **≥ 10**: **stoppen** mit „Drosselung: 10 offene Fabrik-PRs — warte auf
   Merges durch Vincent". Sonst weiter.

3. **CI-Fehler-Guardrail.** Zähle die offenen **Nicht-Bot**-PRs mit **fehlgeschlagener** CI
   (verhindert, dass die Fabrik Quota in einen kaputten Zustand pumpt). Wichtig: nur echte
   Fehlschläge (`bucket == "fail"`) zählen — **laufende/pending** Checks sind kein Fehler:
   ```bash
   count=0
   for pr in $(gh pr list --state open --json number,author \
        --jq '.[] | select(.author.is_bot == false) | .number'); do
     fails=$(gh pr checks "$pr" --json bucket \
       --jq '[.[] | select(.bucket == "fail")] | length' 2>/dev/null || echo 0)
     [ "${fails:-0}" -gt 0 ] && count=$((count+1))
   done
   echo "rote-PRs=$count"
   ```
   → Ist `rote-PRs` **≥ 3**: **stoppen** mit „Zu viele rote PRs ($count) — erst aufräumen".
   Sonst weiter.

4. **Slice umsetzen.** Alle Gates passiert → führe **`/implement-next`** aus
   (`.claude/commands/implement-next.md`): es wählt das nächste `status:ready`-Issue nach
   Priorität, setzt es TDD- und scope-treu um, öffnet einen kleinen PR und aktiviert das
   Auto-fix-Monitoring. Findet `/implement-next` **kein** passendes Issue, stoppt es bereits
   selbst sauber — dann ist auch dieser Lauf ohne Slice zu Ende.

## Feste Regeln

- **Merge-Policy:** Die Fabrik öffnet nur PRs und merged **nie autonom** — das Mergen bleibt
  (Stand jetzt) komplett bei Vincent. Welche PRs Fast-Merge vs. genaue Prüfung sind, regeln die
  **Risiko-Tiers** in `CLAUDE.md` (Reversibilität × CI-Blindheit), nicht die alte
  Kategorie-Liste.
- **Ein PR pro Lauf.** Auch wenn Zeit bliebe — mehr Durchsatz kommt über die nächste
  Cron-Feuerung, nicht über einen Loop in dieser Session.
- Es gelten zusätzlich alle Regeln aus `CLAUDE.md` und `/implement-next`.
