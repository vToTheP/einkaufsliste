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

4. **Review-Rückstand (Vorrang vor neuer Slice).** Die Auto-fix-Reaktion aus
   `/implement-next` lebt nur so lange wie die Session, die den PR geöffnet hat — bei einem
   6h-Takt ist die längst beendet, wenn Vincent Stunden später reviewt. Diese Stufe holt
   liegengebliebenes Review-Feedback nach, **bevor** neue Arbeit entsteht: die Review-Queue
   leerziehen schlägt neue PRs aufstapeln.

   **Warum ein Marker statt des Autors:** Die Cloud-Session ist als `vToTheP` authentifiziert
   — dieselbe Identität wie Vincent. „Feedback" und „Antwort des Agenten" sind am Autor
   **nicht** unterscheidbar. Deshalb signiert der Agent **jede** eigene PR-Äußerung mit einer
   letzten Zeile:

   ```
   <!-- factory-autofix -->
   ```

   Ein PR hat **Rückstand**, wenn mindestens eines zutrifft:
   - er hat **unresolved review threads**, oder
   - seine neueste Äußerung (Review-Body, Inline-Kommentar oder PR-Kommentar) trägt den
     Marker **nicht** — also ist das letzte Wort nicht vom Agenten.

   Beides ist stateless und idempotent: der Agent resolved die Threads und antwortet mit
   Marker, damit terminiert die Prüfung von selbst.

   ```bash
   for pr in $(gh pr list --state open --json number,author \
        --jq '.[] | select(.author.is_bot == false) | .number' | sort -n); do
     open_threads=$(gh api graphql -f query='
       query($owner:String!,$repo:String!,$pr:Int!){ repository(owner:$owner,name:$repo){
         pullRequest(number:$pr){ reviewThreads(first:100){ nodes{ isResolved } } } } }' \
       -F owner=vToTheP -F repo=einkaufsliste -F pr="$pr" \
       --jq '[.data.repository.pullRequest.reviewThreads.nodes[]|select(.isResolved==false)]|length')
     # Neueste Äußerung über alle drei Formen hinweg; trägt sie den Marker?
     last=$( { gh api "repos/vToTheP/einkaufsliste/pulls/$pr/reviews" \
                 --jq '.[]|select((.body//"")!="")|"\(.submitted_at)\t\(.body)"'
              gh api "repos/vToTheP/einkaufsliste/pulls/$pr/comments" \
                 --jq '.[]|"\(.created_at)\t\(.body)"'
              gh api "repos/vToTheP/einkaufsliste/issues/$pr/comments" \
                 --jq '.[]|"\(.created_at)\t\(.body)"'; } 2>/dev/null | sort | tail -1)
     unanswered=no
     [ -n "$last" ] && ! printf '%s' "$last" | grep -q 'factory-autofix' && unanswered=yes
     [ "${open_threads:-0}" -gt 0 ] || [ "$unanswered" = yes ] \
       && echo "RÜCKSTAND pr=$pr threads=$open_threads unbeantwortet=$unanswered"
   done
   ```

   → **Kein** Treffer: weiter zu Schritt 5.
   → Treffer: nimm den **ersten** (niedrigste PR-Nummer = FIFO) und arbeite **nur diesen**
   PR ab — Kommentare lesen, Ursache analysieren, Fix pushen, antworten (mit Marker!),
   Threads resolven. Danach **Session beenden, ohne neue Slice**. Das hält die Regel „eine
   Arbeitseinheit pro Feuerung" ein; der nächste PR kommt bei der nächsten Feuerung dran.

   **Widerspruch ist erlaubt.** Ist ein Review-Punkt sachlich falsch oder verlangt er
   Scope-Creep: **nicht** blind umsetzen. Im Thread begründet widersprechen (mit Marker),
   Thread **nicht** resolven, bei echtem Scope-Creep ein Backlog-Issue anlegen. `CLAUDE.md`
   gilt auch gegenüber einem Reviewer.

5. **Slice umsetzen.** Alle Gates passiert → führe **`/implement-next`** aus
   (`.claude/commands/implement-next.md`): es wählt das nächste `status:ready`-Issue nach
   Priorität, setzt es TDD- und scope-treu um, öffnet einen kleinen PR und aktiviert das
   Auto-fix-Monitoring. Findet `/implement-next` **kein** passendes Issue, stoppt es bereits
   selbst sauber — dann ist auch dieser Lauf ohne Slice zu Ende.

## Feste Regeln

- **Never-auto-merge:** Die Fabrik öffnet nur PRs und merged **nie**. Das Mergen bleibt bei
  Vincent.
- **Ein PR pro Lauf.** Auch wenn Zeit bliebe — mehr Durchsatz kommt über die nächste
  Cron-Feuerung, nicht über einen Loop in dieser Session.
- Es gelten zusätzlich alle Regeln aus `CLAUDE.md` und `/implement-next`.
