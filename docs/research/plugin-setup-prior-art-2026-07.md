# Prior Art — Setup, Konfiguration und Scaffolding in Claude-Code-Plugins

> **Zweck:** Input für Wayfinder-Karte #137 ("AFK-Fabrik als wiederverwendbare Dependency"),
> Ticket #139. Beantwortet die vier Fragen aus dem Ticket anhand des lokal vorhandenen
> `mattpocock-skills`-Plugins sowie öffentlicher Vergleichsbeispiele. Kein PRD, keine
> Entscheidung — reine Bestandsaufnahme für die Wayfinder-Map.
>
> **Methodik:** Primärquelle war der lokale Plugin-Cache (direkt gelesen, Zeilenzitate).
> Öffentliche Vergleichsbeispiele wurden über Web-Suche gefunden und per `WebFetch`
> gegen die jeweiligen Roh-Dateien (`raw.githubusercontent.com`) verifiziert — ein erster
> Treffer zu `troykelly/claude-skills` (angebliches `gh label create`-Bootstrap) hat sich
> beim Gegenlesen der Rohdatei **nicht** bestätigt und wurde verworfen; das ist unten als
> Negativbefund vermerkt statt stillschweigend weggelassen.

---

## Ausgangspunkt: `mattpocock-skills` — `setup-matt-pocock-skills`

Pfad: `C:\Users\Vincent\.claude\plugins\cache\mattpocock\mattpocock-skills\1.2.0\skills\engineering\setup-matt-pocock-skills\`

### Mechanismus

- **Nie automatisch aufrufbar.** `SKILL.md:4`: `disable-model-invocation: true`. Laut
  offizieller Doku bedeutet das Feld: Claude sieht den Skill nicht in seiner
  Intent-Matching-Pass, er bleibt aber explizit aufrufbar (Quelle:
  https://code.claude.com/docs/en/skills, bestätigt über Web-Suche/Sekundärquellen wie
  https://www.developersdigest.tech/guides/disable-model-invocation).
- **Explore → abschnittsweise fragen → schreiben**, exakt in dieser Reihenfolge
  (`SKILL.md:17-112`, Abschnitte "1. Explore", "2. Present findings and ask",
  "3. Confirm and edit", "4. Write", "5. Done").
- **Explore liest, bevor irgendetwas angenommen wird** (`SKILL.md:19-30`): `git remote -v`,
  `.git/config`, ob `AGENTS.md`/`CLAUDE.md` existieren, ob schon ein `## Agent skills`-Block
  da ist, `CONTEXT.md`/`CONTEXT-MAP.md`, `docs/adr/`, `docs/agents/` (eigene Vorläufer-Outputs),
  `.scratch/`, ob der `triage`-Skill überhaupt installiert ist, Monorepo-Signale.
- **Seed-Templates liegen direkt im Skill-Ordner** und werden als Ausgangspunkt kopiert/
  angepasst (`SKILL.md:104-112`): `issue-tracker-github.md`, `issue-tracker-gitlab.md`,
  `issue-tracker-local.md`, `triage-labels.md`, `domain.md` — alle als Dateien neben der
  `SKILL.md` im Plugin selbst vorhanden (verifiziert: `ls` im Skill-Ordner).
- **Idempotenz explizit geregelt**, nicht nur implizit:
  - `SKILL.md:76,80`: "Never create `AGENTS.md` when `CLAUDE.md` already exists (or vice
    versa) — always edit the one that's already there." Bei keinem von beiden fragt der
    Skill nach (`SKILL.md:78`), er entscheidet nicht eigenmächtig.
  - `SKILL.md:82`: "If an `## Agent skills` block already exists in the chosen file,
    update its contents in-place rather than appending a duplicate. Don't overwrite user
    edits to the surrounding sections." — In-place-Update eines markierten Blocks statt
    Append, mit Rücksicht auf umgebenden Freitext.
  - `SKILL.md:116`: "Mention they can edit `docs/agents/*.md` directly later — re-running
    this skill is only necessary if they want to switch issue trackers or restart from
    scratch." — Re-Run ist ausdrücklich optional, kein erzwungener Sync-Mechanismus.

### Config-als-Adapter — wie andere Skills die geschriebenen Dateien lesen

Das im Ticket behauptete Muster ("die übrigen Skills lesen zur Laufzeit `docs/agents/*.md`")
ist **nur teilweise** belegbar. Direkte Suche (`grep -rln "docs/agents"` über alle
`skills/engineering/*/SKILL.md`) findet den Verweis nur in **zwei** Dateien:

- `skills/engineering/code-review/SKILL.md:13`: "The issue tracker should have been
  provided to you — run `/setup-matt-pocock-skills` if `docs/agents/issue-tracker.md` is
  missing."
- `skills/engineering/code-review/SKILL.md:29`: "Issue references in the commit messages
  (`#123`, `Closes #45`, GitLab `!67`, etc.) — fetch via the workflow in
  `docs/agents/issue-tracker.md`."
- `skills/engineering/setup-matt-pocock-skills/SKILL.md` selbst (Autor der Dateien).

`triage` und `wayfinder` referenzieren **nicht** den Dateipfad `docs/agents/issue-tracker.md`
direkt, sondern beschreiben das Konzept in Prosa und verweisen auf die Setup-Routine:

- `skills/engineering/triage/SKILL.md:43`: "These are canonical role names — the actual
  label strings used in the issue tracker may differ. The mapping should have been
  provided to you - run `/setup-matt-pocock-skills` if not."
- `skills/engineering/wayfinder/SKILL.md:25`: "Where the map, its child tickets, blocking,
  and frontier queries physically live is tracker-specific. The issue tracker should have
  been provided to you — run `/setup-matt-pocock-skills` if not. Consult the tracker doc's
  ['Wayfinding operations'] section for how *this* repo expresses them. If no tracker has
  been provided, default to the local-markdown tracker."

Befund: Das Adapter-Muster existiert, ist aber **lose gekoppelt** — kein Skill parst
`docs/agents/issue-tracker.md` programmatisch; jeder verweist in Prosa auf "wurde dir
bereitgestellt, sonst Setup laufen lassen" und hat einen **Default-Fallback** (lokale
Markdown-Tracker), falls die Datei fehlt. `domain-modeling` liest dagegen direkt
`CONTEXT.md`/`docs/adr/` (`skills/engineering/domain-modeling/SKILL.md:16,24,40`), nicht
über eine `docs/agents/domain.md`-Zwischenschicht — die Seed-Datei `domain.md` beschreibt
für die *anderen* Skills nur die Konsum-Regel, ist selbst aber eher Meta-Doku als
Laufzeit-Config.

### Was `setup-matt-pocock-skills` NICHT anfasst

Das Plugin scaffoldet ausschließlich **Dokumentationsdateien im Repo**
(`docs/agents/*.md`, `## Agent skills`-Block in `CLAUDE.md`/`AGENTS.md`). Es gibt in der
gesamten `mattpocock-skills`-Sammlung **keinen** Treffer für GitHub-Labels, Issue-Templates
oder Workflow-Dateien, die ins Zielrepo geschrieben würden:

```
grep -rln "gh label create|gh api.*labels|.github/workflows|issue_template|ISSUE_TEMPLATE" skills/
→ nur skills/in-progress/wizard/SKILL.md
```

Der Treffer ist der **`wizard`-Skill** (Status: `in-progress`, nicht im veröffentlichten
`plugin.json`-Manifest gelistet — siehe `.claude-plugin/plugin.json`, Feld `skills`, das
`wizard` nicht enthält). `wizard` ist kein Repo-Scaffolder im Sinne des Tickets, sondern
generiert ein **ephemeres Bash-Skript**, das einen *Menschen* durch manuelle
Drittanbieter-Konfiguration führt (`SKILL.md:9`: "It opens each URL, says exactly what to
click and copy, captures the values, writes them where they belong (`.env`, GitHub
secrets)…"). Es schreibt `.env`-Dateien und GitHub-Secrets via `gh secret`/`gh variable`
(`SKILL.md:11,36`), **nie** Workflows oder Labels. Ausdrücklich HITL: "Don't run it
end-to-end yourself — it opens browsers and blocks on human input" (`SKILL.md:44`).

**Befund zu Frage 1 (Teil 2) für die primäre Quelle: Es gibt keine Prior Art im
`mattpocock-skills`-Plugin dafür, dass ein Plugin die Repo-*Seite* (GitHub-Workflows,
Labels, Issue-Templates) scaffoldet — nur Doku-Dateien im Arbeitsbaum. Das bestätigt die
in Karte #137 vermutete Lücke.**

---

## Vergleichsbeispiel 1 — Claude Code GitHub Actions (`anthropics/claude-code-action`, offizielle Doku)

Quelle: https://code.claude.com/docs/en/github-actions

Dies ist das stärkste gefundene Gegenbeispiel für **echtes Repo-seitiges Scaffolding**
durch offizielle Anthropic-Tooling — allerdings kein "Plugin" im Sinne eines
Skill-Marketplace-Eintrags, sondern ein interaktiver Slash-Command:

- `/install-github-app` installiert die Claude-GitHub-App **und** schreibt danach
  GitHub-Actions-Workflow-Dateien plus ein Secret ins Zielrepo: "Run `/install-github-app`
  in the Claude Code terminal to set up the integration interactively. The command
  installs the Claude GitHub App on your repository and then walks you through adding the
  GitHub Actions workflows and the API key secret."
- **Ausdrücklich HITL, mit harter Berechtigungs-Voraussetzung:** "You must be a repository
  admin to install the GitHub app and add secrets." Kein AFK-Pfad vorgesehen.
- **Manueller Fallback existiert**, ist aber genauso ein manueller Datei-Kopiervorgang,
  keine Automatik: "Copy the workflow file from `examples/claude.yml`… into your
  repository's `.github/workflows/`."
- **Kein Drift-/Migrations-Mechanismus dokumentiert.** Beim Wechsel Beta → v1.0 wird der
  Nutzer mit einer manuellen Migrationstabelle konfrontiert ("Essential changes… All beta
  users must make these changes to their workflow files"), keine automatische
  Re-Synchronisation der im Zielrepo abgelegten Kopie mit einer neueren Plugin-Version.
- **Verifikation ist ein manueller Smoke-Test**, kein Skill-Check: "test the action by
  tagging `@claude` in an issue or PR comment."

**Einordnung:** Das ist Prior Art dafür, dass Repo-seitiges Scaffolding (Workflow-Datei +
Secret) *möglich* und *offiziell unterstützt* ist — aber bewusst als privilegierte,
interaktive, einmalige Aktion gebaut, nicht als etwas, das ein AFK-Agent für ein fremdes
Repo mitbringt.

---

## Vergleichsbeispiel 2 — `troykelly/claude-skills` (GitHub-natives Issue-Driven-Development-Set, 28 Skills)

Quelle: https://github.com/troykelly/claude-skills

Repo-Struktur (via GitHub-API `contents/skills` verifiziert) enthält u.a. `session-start`,
`environment-bootstrap`, `issue-lifecycle`, `project-board-enforcement`,
`epic-management`, `milestone-management`.

- **`session-start/SKILL.md`** prüft beim Sessionstart den bestehenden Zustand statt ihn
  zu erzeugen: `gh auth status`, Git-Verfügbarkeit, Umgebungsvariable `GITHUB_PROJECT`,
  optional `scripts/init.sh`, falls vorhanden. Kein Anlegen von Labels/Feldern/Workflows.
- **`environment-bootstrap/SKILL.md`** ist **lokales Dev-Environment-Setup**
  (Dependency-Install, `.env`-Handling, Docker-Compose-Services, Health-Checks über
  `curl`), **nicht** GitHub-Repo-Scaffolding.
- **`project-board-enforcement/SKILL.md`** liest ausschließlich vorhandenen
  Project-Board-Zustand über gecachte API-Daten und setzt voraus, dass Felder/Status
  bereits konfiguriert sind — reines Konsum-/Adapter-Muster, keine Erzeugung.
- Ein früher Suchtreffer legte nahe, es gäbe hier ein `gh label create`-Bootstrap
  (Labels `parent`, `sub-issue`, `blocked`, `needs-research`, `verified`) — das hat sich
  beim direkten Abruf der Rohdateien (`environment-bootstrap`, `issue-lifecycle`,
  `session-start`, `project-board-enforcement`) **nicht bestätigt**. Kein durchsuchtes
  `SKILL.md` in diesem Repo enthält `gh label create`. **Negativbefund, nicht paraphrasiert
  weggelassen:** Auch dieses vergleichsweise große, GitHub-native Skill-Set scaffoldet die
  Repo-Seite (Labels, Custom Fields, Templates) nicht selbst — es geht production-ready
  konfigurierten GitHub-Zustand voraus und dokumentiert das nicht einmal als
  Setup-Schritt, den ein Mensch nachholen müsste.

**Einordnung:** Bestätigt den Befund aus `mattpocock-skills` von der anderen Seite: ein
zweites, unabhängig entstandenes, deutlich größeres GitHub-Issue-Workflow-Skillset löst
"projektspezifische Konfiguration" ebenfalls nur als **Konsum aus bereits vorhandenem
Zustand**, nie als **Erzeugung** von Labels/Feldern/Workflows im Zielrepo.

---

## Vergleichsbeispiel 3 — `severity1/claude-code-auto-memory`

Quelle: https://github.com/severity1/claude-code-auto-memory

Anderer Anwendungsfall (automatische `CLAUDE.md`-Pflege statt Issue-Tracker-Config), aber
das bisher konkreteste gefundene **Drift-/Idempotenz-Muster** unter den verglichenen
Plugins:

- **Setup-Wizard** `/auto-memory:init` explort und fragt ähnlich wie
  `setup-matt-pocock-skills`: "1. Analyze your codebase structure 2. Detect frameworks and
  build commands 3. Identify subtree candidates (for monorepos) 4. Present findings for
  your approval 5. Generate CLAUDE.md with auto-managed sections." — Menschliche Freigabe
  nur **einmalig beim Setup**.
- **Markierte Abschnitte statt ganzer Datei:** `<!-- AUTO-MANAGED: section-name -->
  … <!-- END AUTO-MANAGED -->` grenzt maschinell gepflegte Blöcke von
  `<!-- MANUAL --> … <!-- END MANUAL -->`-Blöcken ab. Updates ersetzen nur den
  AUTO-MANAGED-Block, "preserves manual content" — dasselbe Grundprinzip wie
  `setup-matt-pocock-skills`' Regel zum `## Agent skills`-Block (`SKILL.md:82`), hier aber
  als generisches, wiederkehrend anwendbares Markersystem statt Einmal-Konvention.
- **Danach vollautomatisch, kein Mensch im Loop:** Ein Stop-Hook prüft am Ende jeder
  Turn-Runde auf geänderte Dateien und spawnt einen isolierten Sub-Agenten, der
  `CLAUDE.md` aktualisiert — "Stop Hook: End of turn → Check for dirty files → Spawn
  isolated agent", "Runs in isolated context window - doesn't consume main session
  tokens". Kein Bestätigungsschritt pro Update.
- **Kein Drift-zwischen-Plugin-und-Kopie-Mechanismus dokumentiert.** Das Marker-System
  löst nur *Datei-internen* Drift (Handbearbeitung vs. generierter Block), nicht das im
  Ticket gefragte Szenario "Plugin-Version wird weiterentwickelt, im Zielrepo liegt eine
  ältere Kopie". Für dieses Szenario wurde in keiner der drei verglichenen Quellen ein
  Mechanismus gefunden (siehe Zusammenfassung unten).

---

## Beantwortung der vier Ticket-Fragen

### 1. Weitere Plugins, GitHub-Workflows/Labels-Scaffolding?

Zwei weitere Beispiele geprüft (s.o.): `troykelly/claude-skills` (Negativbefund — löst
dasselbe Problem wie `mattpocock-skills`, nämlich nur Doku-/Konsum-seitig) und die
offizielle Claude-Code-GitHub-Actions-Integration (Positivbefund, aber kein
"Plugin/Skill" — ein privilegierter, interaktiver Slash-Command mit Admin-Voraussetzung).
`severity1/claude-code-auto-memory` als dritter Beleg für dasselbe Muster: Setup schreibt
nur Dateien im Arbeitsbaum (`CLAUDE.md`), nie GitHub-API-Zustand.

**Klare Aussage zur Lücke:** Es gibt **keine** gefundene Prior Art für ein
Claude-Code-*Skill/Plugin*, das GitHub-Labels oder Issue-Templates im Zielrepo per
`gh label create` / `gh api` o.ä. anlegt. Das einzige gefundene Beispiel für
Repo-seitiges Scaffolding von GitHub-*Automatik* (Workflows, Secrets) ist der offizielle,
nicht als Marketplace-Plugin verpackte `/install-github-app`-Command — und der ist
bewusst HITL mit Admin-Rechten gebaut, kein Muster, das eine AFK-Fabrik 1:1 übernehmen
kann. Für Karte #137s "Repo-Seite … kein Paket kann sie mitbringen, jemand muss sie dort
anlegen" gibt es also **keinen** Gegenbeweis in der recherchierten Prior Art — im
Gegenteil, drei unabhängige Quellen bestätigen dieselbe Grenze.

### 2. Drift-Behandlung

Kein einziges der vier untersuchten Systeme hat einen Mechanismus für "Plugin hat sich
weiterentwickelt, die im Zielrepo abgelegte Kopie ist veraltet":

- `setup-matt-pocock-skills`: Re-Run ist die einzige Migrationsroute, und die ist
  **optional und manuell** ("re-running this skill is only necessary if they want to
  switch issue trackers or restart from scratch", `SKILL.md:116`). Kein Versionsstempel
  in den geschriebenen `docs/agents/*.md`-Dateien, kein automatischer Vergleich
  Plugin-Version vs. Datei-Version.
  - Der einzige Idempotenz-relevante Mechanismus ist **innerhalb einer Datei**: der
    `## Agent skills`-Block wird in-place aktualisiert statt dupliziert (`SKILL.md:82`).
    Das verhindert Duplikate bei Re-Runs, sagt aber nichts darüber, *wann* ein Re-Run
    fällig ist.
- `severity1/claude-code-auto-memory`: Gleiches Bild — Marker-System sichert
  Datei-interne Idempotenz (AUTO-MANAGED vs. MANUAL), aber keine dokumentierte
  Versionsprüfung zwischen Plugin und generierter `CLAUDE.md`.
- Offizielle GitHub-Actions-Integration: Drift wird **nicht automatisch**, sondern per
  manueller Breaking-Change-Tabelle in der Doku kommuniziert (Beta → v1.0-Migration);
  der Nutzer muss selbst erkennen, dass er migrieren muss, und die Änderungen von Hand
  nachziehen.
- `troykelly/claude-skills`: Kein Scaffolding, also auch kein Drift-Problem in diesem
  Bereich — Konsum-Skills sind gegen den *aktuellen* API-Zustand geschrieben, nicht gegen
  eine im Repo abgelegte Kopie.

**Befund:** Über alle vier Quellen hinweg ist "Re-Run bei Bedarf, in-place Update
markierter Blöcke" das einzige real beobachtete Muster — es ist ein
**Idempotenz**-Mechanismus (sicher wiederholbar), kein **Drift-Erkennungs**-Mechanismus
(niemand prüft automatisch, ob ein Re-Run fällig wäre). Für Karte #137 heißt das: ein
Versions-/Drift-Vertrag zwischen Plugin und Zielrepo-Kopien ist unter den geprüften
Beispielen unbeackertes Feld, keine Konvention zum Abschauen vorhanden.

### 3. Verifikation

Auch hier ist "Setup ist korrekt und vollständig" durchweg **informell**:

- `setup-matt-pocock-skills` endet mit Schritt "5. Done" (`SKILL.md:114-116`) — der Skill
  erzählt dem Nutzer, was geschrieben wurde und welche Folge-Skills die Dateien jetzt
  lesen. Kein Lint, kein Konsistenz-Check, keine automatisierte Prüfung, dass z.B. die
  `docs/agents/triage-labels.md`-Tabelle wirklich zu real existierenden Labels im Tracker
  passt.
- Konsumierende Skills verifizieren nur **reaktiv, beim eigenen Gebrauch**: `triage`
  (`SKILL.md:43`) und `wayfinder` (`SKILL.md:25`) prüfen bei Bedarf, ob die Config-Datei
  fehlt, und weisen dann auf den Setup-Skill hin — das ist ein Existenz-Check zur
  Laufzeit, keine vorgelagerte Setup-Verifikation.
- `severity1/claude-code-auto-memory`: Verifikation ist die menschliche Freigabe der
  "Present findings for approval"-Stufe im Wizard selbst — danach kein weiterer Check.
- Offizielle GitHub-Actions-Doku: Verifikation ist ein manueller End-to-End-Smoke-Test
  ("test the action by tagging `@claude` in an issue or PR comment").

**Befund:** Verifikation bedeutet in der gesamten recherchierten Prior Art entweder (a)
ein optimistisches "hier ist, was geschrieben wurde" am Ende des Setup-Flows, oder (b)
ein lazy Existenz-Check zur Laufzeit durch die konsumierenden Skills selbst, oder (c) ein
manueller Smoke-Test durch den Menschen. Ein automatisiertes, eigenständiges
"Setup-Verify"-Kommando (vergleichbar mit einem Health-Check) wurde in keiner Quelle
gefunden.

### 4. AFK/Cron-tauglich vs. Mensch-im-Loop

| Muster | AFK/Cron-tauglich? | Beleg |
|---|---|---|
| Explore → Fragen → Schreiben (Setup-Skill) | **Nein** — Kernschritt ist Nachfragen pro Abschnitt | `setup-matt-pocock-skills` `SKILL.md:32-61` |
| In-Place-Update markierter Blöcke (`## Agent skills`, `AUTO-MANAGED`) | **Ja** — rein mechanisch, kein Urteil nötig, sobald der Block existiert | `setup-matt-pocock-skills` `SKILL.md:82`; `claude-code-auto-memory` Marker-System |
| Konsum von `docs/agents/*.md` zur Laufzeit mit Fallback (lokaler Tracker) | **Ja** — genau das macht `triage`/`wayfinder` bereits, ohne Rückfrage | `wayfinder` `SKILL.md:25` |
| Automatische Stop-Hook-Pflege einer Datei nach jedem Turn | **Ja** — explizit für unbeaufsichtigten Betrieb gebaut | `claude-code-auto-memory` Stop-Hook-Mechanismus |
| GitHub-App-Installation + Secret-Vergabe | **Nein** — erfordert Repo-Admin-Rechte und Browser-Interaktion | offizielle Doku: "You must be a repository admin…" |
| Wizard-generiertes Bash-Skript für Drittanbieter-Setup (`wizard`-Skill) | **Nein**, per Design | `wizard` `SKILL.md:44`: "Don't run it end-to-end yourself — it opens browsers and blocks on human input" |
| Label-/Workflow-/Template-Erzeugung im Zielrepo | **Unbelegt** — keine der vier Quellen tut das überhaupt, AFK-Tauglichkeit lässt sich also nicht einmal bewerten | s. Frage 1 |

**Kernmuster für AFK-Tauglichkeit:** Sobald eine Entscheidung (welcher Tracker, welche
Label-Namen, welches Layout) **einmalig mit einem Menschen** getroffen und in einer Datei
mit klar markierten, maschinenlesbaren Abschnitten abgelegt wurde, ist *jede weitere*
Interaktion mit dieser Datei — Lesen, in-place Aktualisieren, Fallback bei Fehlen — AFK-
und cron-tauglich. Der Bruchpunkt liegt konsistent dort, wo neue *Autorität über echten
externen Zustand* nötig wird: GitHub-App-Berechtigungen, Secrets, Drittanbieter-Websites.
Repo-seitiges Scaffolding von Labels/Templates/Workflows wurde nirgends AFK gebaut
gefunden — das bleibt für #137 offener Entwurfsraum, kein abgeschautes Muster.

---

## Übertragbare Muster für #137 (Kurzfassung)

1. **`disable-model-invocation: true`** für den Bootstrap-/Setup-Skill selbst — verhindert
   versehentliches Auslösen durch das Modell, bleibt aber explizit aufrufbar. Belegt in
   offizieller Doku und in `mattpocock-skills`.
2. **Explore → Section-für-Section fragen mit empfohlener Antwort → schreiben** als
   Setup-Flow-Schablone — für die *Agenten-Seite* der Fabrik-Verteilung geeignet, aber per
   Definition HITL, nicht AFK/Cron-fähig.
3. **Seed-Templates im Plugin-Ordner, ins Zielrepo kopiert und angepasst** — überträgt sich
   direkt auf `docs/agents/factory.md`-artige Dateien.
4. **Marker-basierte In-Place-Updates** (`## Agent skills`-Block bzw. `AUTO-MANAGED`/`MANUAL`
   -HTML-Kommentare) als das einzige belastbare Idempotenz-Muster über alle vier Quellen —
   direkt übertragbar auf jeden Block, den die Fabrik künftig automatisiert in `CLAUDE.md`
   pflegen will.
5. **Lose gekoppelter Config-Adapter mit Fallback**: konsumierende Skills prüfen zur
   Laufzeit, ob eine Config-Datei existiert, fallen sonst auf einen sinnvollen Default
   zurück und verweisen in Prosa auf den Setup-Skill — kein programmatisches Parsen nötig.
6. **Klare Lücke, keine Prior Art:** Repo-seitiges Scaffolding von GitHub-Labels,
   Issue-Templates und Workflow-Dateien durch ein Plugin/Skill ist in keiner der vier
   untersuchten Quellen belegt. Das einzige verwandte Beispiel (`/install-github-app`)
   ist ein privilegierter, HITL-only Admin-Flow, kein Muster für AFK-Fabrik-Rollout.
7. **Kein Drift-Vertrag zwischen Plugin-Version und Zielrepo-Kopie gefunden.** Wenn #137
   das lösen will, ist das ein eigenständiger Design-Beitrag, kein Abschauen — z.B. ein
   Versionsstempel-Kommentar im geschriebenen Block, den ein künftiger Setup-Re-Run
   erkennt und diff't.

---

## Quellenliste

- `C:\Users\Vincent\.claude\plugins\cache\mattpocock\mattpocock-skills\1.2.0\skills\engineering\setup-matt-pocock-skills\SKILL.md`
- `C:\Users\Vincent\.claude\plugins\cache\mattpocock\mattpocock-skills\1.2.0\skills\engineering\setup-matt-pocock-skills\{issue-tracker-github.md,issue-tracker-local.md,domain.md,triage-labels.md}`
- `C:\Users\Vincent\.claude\plugins\cache\mattpocock\mattpocock-skills\1.2.0\skills\engineering\{triage,wayfinder,code-review,domain-modeling}\SKILL.md`
- `C:\Users\Vincent\.claude\plugins\cache\mattpocock\mattpocock-skills\1.2.0\skills\in-progress\wizard\SKILL.md`
- `C:\Users\Vincent\.claude\plugins\cache\mattpocock\mattpocock-skills\1.2.0\.claude-plugin\plugin.json`
- https://code.claude.com/docs/en/github-actions
- https://code.claude.com/docs/en/skills
- https://www.developersdigest.tech/guides/disable-model-invocation
- https://github.com/troykelly/claude-skills
- https://raw.githubusercontent.com/troykelly/claude-skills/main/skills/environment-bootstrap/SKILL.md
- https://raw.githubusercontent.com/troykelly/claude-skills/main/skills/issue-lifecycle/SKILL.md
- https://raw.githubusercontent.com/troykelly/claude-skills/main/skills/session-start/SKILL.md
- https://raw.githubusercontent.com/troykelly/claude-skills/main/skills/project-board-enforcement/SKILL.md
- https://github.com/severity1/claude-code-auto-memory
- https://raw.githubusercontent.com/severity1/claude-code-auto-memory/main/README.md
