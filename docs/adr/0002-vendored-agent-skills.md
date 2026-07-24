# Agent-Skills ins Repo vendoren statt per Marketplace-Plugin beziehen

**Status:** accepted

`implement-next.md` nutzt mehrere Skills von Matt Pococks Plugin `mattpocock-skills`
(`code-review` für Review→Fix, `codebase-design` + `improve-codebase-architecture` für den
Architektur-Scan; `tdd` war bereits vendored). Lokal ist das Plugin user-scoped installiert.
**Cloud-Sessions installieren projekt-scoped Marketplaces/Plugins jedoch nicht automatisch
nach** — empirisch bestätigt in Issue #120: der in `.claude/settings.json` eingetragene
Marketplace wird zwar „bekannt", aber nicht installiert; `code-review` war dort nicht
modell-invozierbar und der Review lief als manueller Ersatz.

## Entscheidung

Die von `implement-next.md` benötigten Skills werden **ins Repo kopiert** (`.claude/skills/`),
statt sie über einen Marketplace zu beziehen. Baseline: Upstream-Commit `9603c1c`
(Plugin-Version `1.2.0`). Herkunft, Umfang und der Re-Sync-Ablauf sind in
[`.claude/skills/VENDORED.md`](../../.claude/skills/VENDORED.md) dokumentiert.

## Betrachtete Alternativen (und warum verworfen)

- **Expliziter Install-Hook in Cloud** (`marketplace add` + `install` beim Session-Start) —
  verworfen: verlangt **jede Session** Netzwerk-Egress zu GitHub und das Fetchen +
  Ausführen von Fremdcode; das durchlöchert die Cloud-Sandbox und vergrößert die
  Trust-Surface bei jedem Start. Zudem agent-getriebene Setup-Kosten (Quota) pro Session.
- **Projekt-scoped `.claude/settings.json` (Marketplace/enabledPlugins)** — allein
  unzureichend: macht das Plugin nur „bekannt", installiert es in Cloud aber nicht (#120).
- **Volles Plugin vendoren** — verworfen: ~20 Skills blähen die Skill-Liste jeder Session auf;
  wir vendoren nur die vier tatsächlich genutzten.

## Konsequenzen

- **Sandbox bleibt intakt:** Skills kommen über den normalen Repo-Clone — kein neuer Netzpfad,
  keine neue Ausführungs-Surface. Der Skill-Text ist versioniert und reviewbar.
- **Quota:** kein Setup-Aufwand pro Session, kleinere Standing-Skill-Liste (nur vier Skills).
- **Preis — Drift:** Upstream-Updates fließen **nicht** automatisch nach. Gegenmaßnahme ist der
  dokumentierte Currency-Check in `VENDORED.md` gegen die Baseline-SHA.
- **Namespace:** In `implement-next.md` heißen die Skills jetzt repo-lokal (`code-review` statt
  `mattpocock-skills:code-review` usw.).
- `improve-codebase-architecture` bleibt korrekt **nicht** modell-invozierbar
  (`disable-model-invocation: true`) und wird nur von einem Explore-Subagenten gelesen; seine
  human-in-the-loop-Schritte (Report, Grilling) sind bewusst nicht Teil des AFK-Flows.
