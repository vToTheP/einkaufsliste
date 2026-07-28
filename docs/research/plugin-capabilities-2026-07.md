# Wissensbasis — Was kann ein Claude-Code-Plugin heute wirklich?

> **Zweck:** Beantwortet Issue #138 (Teil der Wayfinder-Karte #137, "AFK-Fabrik als
> wiederverwendbare Dependency über Projekte hinweg"). Input für #141 (Verteil-Mechanismus
> festlegen). **Kein PRD, keine Entscheidung** — reine Faktenbasis.
>
> **Methodik & Vertrauensgrad:** [P] = Primärquelle (offizielle Claude-Code-Doku unter
> `code.claude.com/docs/en/*`, oder lokal vorliegender Plugin-Cache/Repo-Zustand — Pfad
> statt URL), [E] = **empirisch** in diesem Repo verifiziert (echte Cloud-Session-Probe,
> mit Issue-Link), [B] = Sekundärquelle (nur wenn keine Primärquelle existierte),
> **[unsicher]** = nicht belegbar, mit Begründung, welches Experiment die Frage klären würde.
>
> Alle offiziellen Doku-Links waren zum Recherche-Zeitpunkt (2026-07-28) unter
> `docs.claude.com/en/docs/claude-code/*` per 301-Redirect auf `code.claude.com/docs/en/*`
> verschoben; zitiert wird die Zielseite.

---

## 1. Distribution & Zugriff

**Ein Marketplace-Repo kann privat sein — Client-Auth läuft über den lokalen Git-Credential-Stack,
nicht über einen separaten Claude-Mechanismus.** [P]

- Private Repos werden unterstützt, aber die Hintergrund-Aktualisierung (Auto-Update im
  Hintergrund nach Session-Start) **deaktiviert Credential-Helper** für den `pull` — sie
  authentifiziert sich also **nicht** automatisch über HTTPS, außer über einen global
  konfigurierten Git-URL-Rewrite mit eingebettetem Token. SSH-Remotes mit geladenem
  `ssh-agent`-Key authentifizieren auch im Hintergrund. Schlägt der Hintergrund-Pull fehl,
  greift ein Re-Clone-Fallback, der die normal gespeicherten Credentials nutzt (kann bei
  großen Repos in ein Timeout laufen).
  Quelle: [Plugin marketplaces — Private repositories](https://code.claude.com/docs/en/plugin-marketplaces#private-repositories)
- Empfohlener Weg für verlässliche Auth: Credential-Helper konfigurieren (`gh auth setup-git`
  für GitHub) **und** einen global gescopten Git-URL-Rewrite mit Token setzen, z. B.
  `git config --global url."https://x-access-token:TOKEN@github.com/org/plugins".insteadOf "https://github.com/org/plugins"`.
  In CI/CD (z. B. GitHub Actions) reicht der Default-`GITHUB_TOKEN` **nicht**, weil er nur
  aufs eigene Workflow-Repo zugreifen darf — ein privates Marketplace-Repo in einem anderen
  Repo braucht ein PAT/App-Token. Manuelles `/plugin marketplace update <name>` nutzt immer die
  regulären Credentials, egal was der Hintergrund-Pull kann.
  Quelle: [Plugin marketplaces — Private repository authentication fails](https://code.claude.com/docs/en/plugin-marketplaces#private-repository-authentication-fails)

**Marketplace ohne echtes "Repo" geht auch — lokaler Pfad oder direkte `marketplace.json`-URL.** [P]

- `/plugin marketplace add` akzeptiert vier Quelltypen: GitHub `owner/repo`, beliebige
  Git-URL (GitLab, Bitbucket, self-hosted, HTTPS oder SSH), lokaler Verzeichnispfad (oder
  direkter Pfad zu einer `marketplace.json`), und eine Remote-URL auf eine gehostete
  `marketplace.json`. Ein Marketplace kann auf einen `branch`/`tag`/`sha` gepinnt werden
  (`@ref` bei GitHub-Shorthand, `#ref` bei Git-URLs).
  Quelle: [Discover and install plugins — Add marketplaces](https://code.claude.com/docs/en/discover-plugins#add-marketplaces)
- **Ganz ohne Marketplace** geht es ebenfalls: `claude --plugin-dir ./mein-plugin` lädt ein
  Plugin direkt aus einem lokalen Verzeichnis für die Session (auch als `.zip`, ab Claude
  Code v2.1.128), `--plugin-url` lädt ein gehostetes `.zip`-Archiv per URL für die Session.
  Beide sind **Session-lokal, nicht persistent installiert**.
  Quelle: [Create plugins — Test your plugins locally](https://code.claude.com/docs/en/plugins#test-your-plugins-locally)
- Für dauerhaftes Auto-Load ohne Marketplace/Install-Schritt: `claude plugin init` legt ein
  `@skills-dir`-Plugin unter `~/.claude/skills/<name>/` an, das ab der nächsten Session ohne
  Marketplace lädt. Admins können diese Quelle über `strictKnownMarketplaces` oder
  `{"source": "skills-dir"}` in `blockedMarketplaces` sperren.
  Quelle: [Plugins reference — Skills-directory plugins](https://code.claude.com/docs/en/plugins-reference#skills-directory-plugins)

---

## 2. Versionierung

**Pinnen ist möglich, aber die Semantik hängt an genau einer Regel, die leicht zu übersehen ist:
wer `version` in `plugin.json` setzt, muss sie bei jedem Release bewusst hochzählen.** [P]

- Claude Code löst die effektive Version eines Plugins in dieser Reihenfolge auf: (1) `version`
  in `plugin.json`, (2) `version` im Marketplace-Eintrag, (3) Git-Commit-SHA der Quelle (nur für
  `github`-, `url`-, `git-subdir`- und relative Pfad-Quellen in einem git-gehosteten Marketplace).
  Diese Version ist der Cache-Key für Update-Erkennung — `/plugin update` bzw. Auto-Update
  überspringen das Update, wenn die aufgelöste Version bereits die installierte ist.
  Quelle: [Plugins reference — Distribution and versioning reference](https://code.claude.com/docs/en/plugins-reference#distribution-and-versioning-reference)
- **Zwei Modi:** explizite Version (`"version": "2.1.0"` in `plugin.json`) → Nutzer bekommen
  Updates **nur** bei Versionssprung; neue Commits ohne Versionsbump ändern nichts, `/plugin
  update` meldet "already at the latest version". Commit-SHA-Version (kein `version`-Feld
  gesetzt) → **jeder** neue Commit zählt als neue Version, empfohlen für intern aktiv
  entwickelte Plugins. Empfohlenes Schema bei expliziter Version: SemVer
  (`MAJOR.MINOR.PATCH`), dokumentiert per `CHANGELOG.md`.
  Quelle: wie oben, Abschnitt "Version management" / "Two ways to version a plugin"
- **Stolperfalle, direkt in der Doku benannt:** `version` sollte nicht gleichzeitig in
  `plugin.json` **und** im Marketplace-Eintrag gesetzt werden — `plugin.json` gewinnt immer
  ohne Warnung, eine veraltete Manifest-Version kann so eine im Marketplace-Eintrag gesetzte
  Version maskieren.
- **Git-Pin über SHA:** `github`-, `url`- und `git-subdir`-Quellen akzeptieren ein `sha`-Feld
  (voller 40-Zeichen-Commit-SHA). Ist sowohl `ref` als auch `sha` gesetzt, gewinnt `sha` — die
  Installation gelingt bei den meisten Git-Hosts (GitHub, GitLab, Bitbucket) selbst dann noch,
  wenn der `ref`-Branch/Tag inzwischen gelöscht wurde, solange der Commit erreichbar bleibt.
  (AWS CodeCommit unterstützt kein Fetch per SHA — dort muss der `ref` weiter existieren.)
  Quelle: [Plugin marketplaces — Pin dependency versions](https://code.claude.com/docs/en/plugin-marketplaces) (Abschnitt zu git-basierten Quelltypen)
- **Release-Channels ("stable"/"latest")** lassen sich über zwei Marketplace-Einträge bauen,
  die auf unterschiedliche `ref`/`sha` desselben Repos zeigen, zugewiesen an Nutzergruppen
  über Managed Settings.
- **Was bei einem Breaking Change passiert:** Es gibt **keinen** automatischen Mechanismus,
  der einen Major/Breaking-Change verhindert oder ankündigt — das ist reine Autoren-Disziplin
  (SemVer + CHANGELOG). Für **Plugin-Abhängigkeiten** (ein Plugin, das ein anderes voraussetzt)
  existiert eine SemVer-Range-Constraint (`{plugin-name}--v{version}`-Git-Tag-Konvention), die
  verhindert, dass ein Dependency-Update über die erlaubte Range hinaus zieht.
  Quelle: [Plugin dependencies](https://code.claude.com/docs/en/plugin-dependencies)

---

## 3. Was ein Plugin ausliefern kann

**Ein Plugin ist ein Verzeichnis mit optionalem `.claude-plugin/plugin.json`-Manifest plus
bis zu acht Komponentenklassen.** [P]

| Verzeichnis/Datei | Ort | Inhalt |
|---|---|---|
| `.claude-plugin/plugin.json` | Plugin-Root | Manifest (Name, Version, Autor, …) — **einziges**, was in `.claude-plugin/` gehört |
| `skills/` | Plugin-Root | Skills als `<name>/SKILL.md`-Verzeichnisse (bevorzugt) |
| `commands/` | Plugin-Root | Skills als flache Markdown-Dateien (Legacy-Form) |
| `agents/` | Plugin-Root | Custom-Subagenten-Definitionen |
| `hooks/hooks.json` | Plugin-Root | Event-Handler |
| `.mcp.json` | Plugin-Root | MCP-Server-Konfiguration |
| `.lsp.json` | Plugin-Root | LSP-Server-Konfiguration |
| `monitors/monitors.json` | Plugin-Root | Hintergrund-Monitore (z. B. `tail -F` auf ein Log) |
| `bin/` | Plugin-Root | Executables, die während Plugin-Aktivierung in den `PATH` des Bash-Tools gehängt werden |
| `settings.json` | Plugin-Root | Default-Settings beim Enable — aktuell **nur** die Keys `agent` und `subagentStatusLine` unterstützt |

Quelle: [Create plugins — Plugin structure overview](https://code.claude.com/docs/en/plugins#plugin-structure-overview),
[Plugins reference — Plugin components reference](https://code.claude.com/docs/en/plugins-reference#plugin-components-reference)

**Wichtige Stolperfalle, explizit in der Doku als "Common mistake" markiert:** `commands/`,
`agents/`, `skills/`, `hooks/` gehören **nicht** in `.claude-plugin/` — nur `plugin.json` liegt
dort, alles andere auf Plugin-Root-Ebene.

**Namespacing (`plugin:skill`) ist obligatorisch, nicht optional.** [P]

- Plugin-Skills sind **immer** namespaced (`/my-plugin:hello`), um Kollisionen zwischen
  Plugins zu verhindern. Der Namespace-Präfix ist der `name`-Wert aus `plugin.json` (oder,
  wenn ein Marketplace-Eintrag das Plugin unter anderem Namen listet, der Marketplace-Name —
  der ist es auch, den `enabledPlugins` als Key erwartet).
  Quelle: [Create plugins — Quickstart](https://code.claude.com/docs/en/plugins#test-your-plugin)

**`disable-model-invocation` macht einen Skill nur lesbar, nicht modell-invozierbar.** [P] [E]

- `disable-model-invocation: true` im SKILL.md-Frontmatter verhindert, dass Claude den Skill
  automatisch aus dem Kontext heraus wählt — die Datei bleibt aber physisch da und lesbar
  (z. B. für einen Subagenten, der sie explizit einliest). Genau dieses Muster nutzt
  `improve-codebase-architecture` im vendorten mattpocock-Plugin — bewusst **nie**
  modell-invoziert, nur als gelesene Vorlage für den Architektur-Scan-Subagenten in diesem
  Repo. Quelle (lokal): `E:\Projects\einkaufsliste\.claude\skills\VENDORED.md`,
  `C:\Users\Vincent\.claude\plugins\marketplaces\mattpocock\.claude-plugin\plugin.json` (listet
  `improve-codebase-architecture` regulär unter `skills`, das Flag steckt im SKILL.md selbst).
  Dokublenden-Quelle: [Create plugins — Quickstart, Schritt "Add a skill"](https://code.claude.com/docs/en/plugins#test-your-plugin)
  (nutzt `disable-model-invocation: true` im Beispiel für einen Skill, der nur per expliziten
  Slash-Command aufgerufen werden soll, nicht automatisch vom Modell).

**Weitere Grenzen der Skill/Agent-Reichweite:**

- `${CLAUDE_PLUGIN_ROOT}` (Pfad zum Plugin-Root) ändert sich bei jedem Update; die alte
  Versions-Verzeichnis bleibt ca. 2 Wochen nach einem Update auf der Platte, gilt aber als
  ephemer — kein State dort ablegen. Läuft ein Plugin-Update **mitten in einer Session**,
  behalten Hook-Commands, Monitore, MCP- und LSP-Server bis `/reload-plugins` den alten Pfad.
  Quelle: [Plugins reference — Persistent data & version paths](https://code.claude.com/docs/en/plugins-reference)
- Ein installiertes Plugin **kann keine Dateien außerhalb seines eigenen Verzeichnisses
  referenzieren** — Pfade wie `../shared-utils`, die nach außen zeigen, funktionieren nach der
  Installation nicht, weil nur das Plugin-Verzeichnis selbst in den Cache kopiert wird.
  Quelle: [Plugins reference — Plugin cache](https://code.claude.com/docs/en/plugins-reference#plugin-cache),
  bestätigt auch in [Discover and install plugins — Common issues](https://code.claude.com/docs/en/discover-plugins#common-issues)
  ("Files not found after installation: plugins are copied to a cache, so paths referencing
  files outside the plugin directory won't work").

---

## 4. Kritisch — Verfügbarkeit in Cloud-Sessions und `/schedule`-Cron-Routinen

**Kurzfassung: Ein projekt-scoped Plugin-Eintrag (`.claude/settings.json` →
`extraKnownMarketplaces` + `enabledPlugins`) macht das Plugin in einer Cloud-Session **nicht**
automatisch verfügbar. Das ist sowohl offiziell dokumentiert als auch in diesem Repo empirisch
gegen eine echte Cloud-Session verifiziert.**

### 4.1 Offizielle Doku — der Installationsschritt ist ein Vertrauens-Prompt, kein Auto-Install

- **Team-Marketplaces laufen über einen Trust-Gate mit interaktivem Prompt, nicht über
  Auto-Install:** *"Team admins can set up automatic marketplace installation for projects by
  adding marketplace configuration to `.claude/settings.json`. When team members trust the
  repository folder, Claude Code prompts them to install these marketplaces and plugins."*
  Und, seit Claude Code v2.1.195 explizit verschärft: *"this install step applies on every
  path that loads plugins. A plugin that only the project's `.claude/settings.json` enables,
  and that comes from an external source such as a GitHub repository or npm package, doesn't
  load until the team member installs it. Until then, Claude Code reports the plugin as not
  installed and shows the `claude plugin install` command to run."*
  Quelle: [Discover and install plugins — Configure team marketplaces](https://code.claude.com/docs/en/discover-plugins#configure-team-marketplaces)
- Dieselbe Doku empfiehlt für den Fall, dass `/plugin` in einer Umgebung nicht verfügbar ist,
  explizit den Umweg über den Desktop-Plugin-Browser **oder** die `enabledPlugins`-Deklaration
  "for cloud sessions" — aber ohne zu belegen, dass dieser Eintrag dort *automatisch* greift;
  es bleibt bei "declare it", nicht "it installs itself".
  Quelle: [Discover and install plugins — Official Anthropic marketplace](https://code.claude.com/docs/en/discover-plugins#official-anthropic-marketplace)
- **Project-Scope-Plugins laufen ohnehin durch einen zusätzlichen, engeren Trust-Gate**, selbst
  wenn sie geladen werden: *"A project-scope plugin is checked into the repository and reaches
  every collaborator who clones it. Because that content comes from the repository rather than
  from you, it loads only after the same trust gate that governs `.claude/settings.json`, and
  components that run code are restricted further"* — konkret: MCP-Server im Plugin durchlaufen
  dieselbe Pro-Server-Freigabe wie ein Projekt-`.mcp.json`, LSP-Server starten erst nach
  Workspace-Trust, **Background-Monitore laden in Project-Scope gar nicht.**
  Quelle: [Plugins reference — Plugin installation scopes](https://code.claude.com/docs/en/plugins-reference#plugin-installation-scopes)
- **Routinen (`/schedule`) laufen explizit ohne jede Freigabe-Interaktion:** *"Routines run
  autonomously as full Claude Code cloud sessions: there is no permission-mode picker and no
  approval prompts during a run."* Das ist strukturell unvereinbar mit einem Mechanismus, der
  laut obigem Zitat einen interaktiven "Claude Code prompts them to install"-Schritt braucht —
  eine Cron-Routine kann diesen Prompt nicht beantworten. Die offizielle Routinen-Doku
  (`code.claude.com/docs/en/routines`, komplett gelesen) erwähnt Plugins oder Marketplaces an
  **keiner** Stelle — weder als verfügbar noch als Einschränkung. Das ist selbst ein Fund: die
  Doku macht zu diesem Schnittpunkt schlicht keine Aussage.
  Quelle: [Automate work with routines — Create a routine](https://code.claude.com/docs/en/routines#create-a-routine)

### 4.2 Empirisch in diesem Repo verifiziert — deckungsgleich mit der Doku-Lücke

Issue #120 (Teil derselben Fabrik-Historie) hat genau dieses Verhalten **gegen eine echte
Cloud-Session** getestet, nachdem #119 den Marketplace projekt-scoped in
`.claude/settings.json` eingecheckt hatte:

> "`ListPlugins` mit Keywords `["mattpocock", "code-review"]` → **leer**. `SearchPlugins` ... →
> zeigt nur ein unabhängiges `qodo-skills`-Plugin, **kein** `mattpocock-skills@mattpocock`.
> `ListSkills` ... → **leer**. Die zu Session-Start geladene Skill-Liste enthält
> `mattpocock-skills:code-review` ebenfalls nicht. **Ergebnis: Der Cloud-Bootstrap installiert
> den projekt-scoped Marketplace/Plugin aus `.claude/settings.json` nicht automatisch nach.**"

Quelle (lokal): `gh issue view 120 -R vToTheP/einkaufsliste --comments` (Kommentar vom
2026-07-20), destilliert in `E:\Projects\einkaufsliste\docs\adr\0002-vendored-agent-skills.md`
("**Cloud-Sessions installieren projekt-scoped Marketplaces/Plugins jedoch nicht automatisch
nach** — empirisch bestätigt in Issue #120: der in `.claude/settings.json` eingetragene
Marketplace wird zwar "bekannt", aber nicht installiert").

Die gleiche Baustelle traf zusätzlich die Cron-getriggerte Ultrareview: laut
`E:\Projects\einkaufsliste\docs\agents\factory.md` (Abschnitt "Review-Zyklus") wurde
"**Getestet & verworfen (2026-07-20): Cron-getriggerte Ultrareview geht NICHT.** Eine
Cloud-/Routine-Session kann `/code-review ultra` nicht ausführen — das Command ist dort nicht
verfügbar und bietet nur einen lokalen Fallback an." `/code-review ultra` ist selbst kein
Plugin-Skill, sondern demonstriert dasselbe Muster: harness-Features, die nicht Teil des
frisch geklonten Repo-Inhalts sind, fehlen in Cloud-/Cron-Sessions.

### 4.3 Was daraus folgt

- **Verifiziert (Primärquelle + Empirie decken sich):** Projekt-scoped
  `extraKnownMarketplaces`/`enabledPlugins` über `.claude/settings.json` reicht **nicht**, um
  ein Plugin in einer Cloud-Session oder einer `/schedule`-Routine automatisch verfügbar zu
  machen. Der vorgesehene Auto-Install-Pfad hängt an einem interaktiven Trust-Prompt, den eine
  unbeaufsichtigte Session strukturell nicht beantworten kann.
- **Verifizierter Workaround, bereits produktiv in diesem Repo:** Vendoring — die tatsächlich
  benötigten Skill-Dateien werden ins Repo kopiert (`.claude/skills/`) statt über Marketplace
  bezogen. Kommt über den normalen Git-Clone in jede Session, lokal wie Cloud wie Routine, ohne
  Install-Schritt. Nachteil: Drift gegen Upstream, siehe `VENDORED.md`-Re-Sync-Ablauf.
- **[unsicher] Nicht durch Primärquelle oder eigene Empirie abgedeckt:**
  1. Ob ein **`claude plugin install ... --scope project`**-Schritt, der explizit **im
     `Setup`-Environment-Skript der Cloud-Umgebung** (nicht in `.claude/settings.json`) läuft,
     das Plugin doch belastbar installiert — die Doku nennt `Setup`-Skripte für Cloud-Umgebungen
     ("Setup script: install dependencies and tools the routine needs. The result is cached")
     als allgemeinen Mechanismus, aber keine Quelle bestätigt oder widerlegt explizit, dass ein
     darin ausgeführter `claude plugin install`-Befehl in der anschließenden Session wirkt.
  2. Ob sich das Ergebnis von #120 mit einer **neueren Claude-Code-Version** ändert — die
     zitierte Doku-Passage zu "this install step applies on every path" ist ab v2.1.195
     datiert, das #120-Experiment lief am 2026-07-20 gegen die zu dem Zeitpunkt aktuelle
     Cloud-Version; ob die installierte Version über oder unter diesem Schwellenwert lag, ist
     aus dem Issue nicht ablesbar.
  3. Ob ein **user-scope**-Plugin (statt project-scope) über ein persönliches Cloud-Konto-Setting
     in Cloud-Sessions/Routinen greift — das Repo hat nur den project-scope-Pfad getestet, weil
     das Ziel Team-/Fabrik-Sharing ist, nicht ein persönliches Setup.
  - **Welches Experiment das klären würde:** In einer echten Cloud-Session (oder besser: einer
    `/schedule`-Routine, da das der eigentliche Zielfall ist) nach einem frischen Checkout mit
    aktuellem Claude-Code-Stand erneut `ListPlugins`/`ListSkills` gegen ein projekt-scoped
    Plugin prüfen — einmal mit reinem `.claude/settings.json`-Eintrag, einmal zusätzlich mit
    einem `claude plugin install --scope project`-Aufruf im Environment-`Setup`-Skript der
    Cloud-Umgebung. Das ist der konkrete Praxistest, den #141 (Verteil-Mechanismus) vor der
    finalen Entscheidung braucht, falls die Karte nicht ohnehin direkt aufs Vendoring-Muster
    setzt.

---

## 5. Harte Grenzen

**Frage bestätigt, mit einer wichtigen Präzisierung: Die Grenze liegt nicht im
Plugin-/Marketplace-Mechanismus selbst, sondern im normalen Tool-Permission-System, das jede
Session — ob mit oder ohne Plugin — umschließt.**

- **Kein Auto-Install-/Postinstall-Hook, der beim Plugin-Install von sich aus Dateien ins
  Zielrepo schreibt.** Die vollständige Hook-Event-Liste enthält keinen "on plugin install"-
  oder "on marketplace add"-Event. Der einzige explizit für einmalige Vorbereitung gedachte
  Event ist `Setup` ("When you start Claude Code with `--init-only`, or with `--init` or
  `--maintenance` in `-p` mode. For one-time preparation in CI or scripts") — der feuert aber
  beim **Start** eines expliziten Init-/Maintenance-Laufs, nicht automatisch beim
  Plugin-Install selbst, und ist wie jeder andere Hook nur ein Shell-Befehl, der denselben
  Permission-Regeln unterliegt wie manuell getippte Bash-Aufrufe.
  Quelle: [Hooks reference — Hook events](https://code.claude.com/docs/en/hooks) (Event-Tabelle)
- **Ein Hook oder ein modell-invozierter Skill *kann* technisch `gh label create`, einen Commit
  auf `.github/workflows/**` oder `gh secret set` ausführen** — dafür gibt es keine
  Plugin-spezifische Sperre. Was das in der Praxis verhindert, ist ausschließlich das normale
  Bash-/Edit-/Write-Tool-Permission-Gate der Session (interaktiver Approval-Prompt lokal,
  Auto-Mode-Klassifikator oder fehlende Repo-Schreibrechte/Secrets in Cloud/Routine) — **nicht**
  eine Eigenschaft des Plugin-Systems. Für GitHub-Labels/Secrets kommt zusätzlich hinzu, dass
  dafür passende `gh`-Scopes/Repo-Admin-Rechte im Ausführungskontext vorhanden sein müssen;
  ohne die scheitert der Befehl unabhängig vom Plugin.
- **Repo-Dateien wie `CLAUDE.md` oder `.github/workflows/**`:** Ein Plugin kann solche Dateien
  **nicht "mitbringen"** im Sinne von "beim Install automatisch ins Zielrepo kopiert" — dafür
  gibt es keinen deklarativen Mechanismus im Manifest (kein `plugin.json`-Feld für
  "Ziel-Repo-Dateien"). Was es gibt, ist das **Skill-getriebene Schreiben zur Laufzeit**: ein
  Skill (modell-invoziert oder per Slash-Command) kann in der Session mit Write/Edit
  ausdrücklich Dateien ins aktuell geöffnete Repo schreiben — das ist explizit das Muster, das
  in Karte #137 als Prior Art genannt wird (`setup-matt-pocock-skills`: "exploriert das Repo,
  fragt Abschnitt für Abschnitt, schreibt Config-Dateien aus Seed-Templates ins Zielprojekt").
  Das ist **kein Plugin-Installationsschritt**, sondern eine bewusste, im laufenden Chat
  ausgeführte Aktion des Skills — unterliegt denselben Tool-Permissions wie jede andere
  Dateischreibung. Quelle (lokal, Prior-Art-Beleg): `setup-matt-pocock-skills`-Skill unter
  `C:\Users\Vincent\.claude\plugins\marketplaces\mattpocock\skills\engineering\setup-matt-pocock-skills`.
- **GitHub-Labels, Secrets, Cron-Routinen im Zielprojekt:** Keine dieser drei Kategorien hat
  eine Entsprechung im Plugin-Manifest oder in der Marketplace-Spezifikation — es gibt kein
  `plugin.json`-Feld, das Labels anlegt, Secrets setzt oder eine `/schedule`-Routine registriert.
  Routinen leben ohnehin auf **Account-Ebene** ("Routines belong to your individual claude.ai
  account. They are not shared with teammates"), nicht im Repo — ein Plugin könnte sie also
  strukturell gar nicht "mitbringen", selbst wenn es wollte, weil Routinen kein Repo-Artefakt
  sind, sondern Cloud-Kontostand.
  Quelle: [Automate work with routines — Create a routine](https://code.claude.com/docs/en/routines#create-a-routine)
- **Zusammengefasst:** Die Aussage aus Karte #137 ("kein Paket kann sie mitbringen, jemand muss
  sie dort anlegen") ist **verifiziert** — mit der Präzisierung, dass die Grenze nicht technisch
  im Plugin-System erzwungen wird, sondern sich aus drei unabhängigen Tatsachen ergibt: (a) kein
  deklarativer "install → schreibe ins Zielrepo"-Mechanismus existiert, (b) Routinen sind
  Account-, nicht Repo-Zustand, (c) alles, was ein Hook/Skill *könnte*, bleibt hinter dem
  normalen Permission-Gate der Session.

---

## Offene Fragen für #141 (Verteil-Mechanismus)

1. Das [unsicher]-Experiment aus Abschnitt 4.3 (`Setup`-Skript-Install in einer echten
   Cloud-Umgebung/Routine) ist der einzige noch unverifizierte Hebel, der ein
   Marketplace-Plugin für die Fabrik doch cron-tauglich machen könnte. Lohnt sich der
   Test-Aufwand, oder ist Vendoring (bereits produktiv, siehe ADR 0002) einfach die
   pragmatischere Standard-Antwort für #141?
2. Keine der fünf Fragen liefert einen Befund, der für ein **Git-Submodul/Subtree** oder ein
   **Template-/Sync-Skript** spricht oder dagegen — das bleibt Gegenstand von #141 selbst.
