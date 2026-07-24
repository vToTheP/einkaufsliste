# Vendored Skills — Herkunft & Aktualität

Ein Teil der Skills unter `.claude/skills/` ist **aus einem externen Plugin ins Repo kopiert**
(„vendored"), nicht über einen Marketplace bezogen. Grund: Cloud-Sessions laufen in einer
Sandbox und installieren projekt-scoped Marketplaces/Plugins **nicht** automatisch nach
(empirisch bestätigt, siehe Issue #120). Vendoring macht die Skills über den normalen Repo-Clone
verfügbar — ohne Netzwerk-Egress, ohne Fremdcode-Ausführung beim Session-Start, mit voller
Review-Kontrolle über den Text, der in der Fabrik läuft. Siehe [ADR 0002](../../docs/adr/0002-vendored-agent-skills.md).

## Quelle

- **Upstream:** `mattpocock/skills` (GitHub) — Plugin `mattpocock-skills`
- **Lizenz:** MIT, Copyright (c) 2026 Matt Pocock
- **Baseline-Commit:** `9603c1c` (entspricht Plugin-Version `1.2.0`)

## Vendored (nur was `implement-next.md` braucht — nicht das ganze Plugin)

| Skill | Genutzt von | Modell-invozierbar? |
|---|---|---|
| `tdd/` | `implement-next.md` (Red→Green) | ja |
| `code-review/` | `implement-next.md` (Review→Fix) | ja |
| `codebase-design/` | Vokabular für den Architektur-Scan | ja |
| `improve-codebase-architecture/` | nur Schritt 1 (Explore), vom Subagenten **gelesen** | **nein** (`disable-model-invocation: true`) — by design |

**Weggelassen:** die `agents/openai.yaml`-Adapter jedes Skills (nur für OpenAI-Tooling, für
Claude Code irrelevant). `improve-codebase-architecture` referenziert intern `/grilling` und
`/domain-modeling` (Schritt 2/3) — die sind **human-in-the-loop und nicht Teil des
AFK-Flows**, deshalb bewusst **nicht** mit-vendored; diese Verweise laufen ins Leere und das
ist ok.

## Aktualität prüfen / re-syncen

Vendoring verliert Upstream-Updates automatisch — bewusster Trade gegen Sandbox-Integrität.
Currency-Check gegen upstream:

```bash
# Marketplace-Clone (falls lokal vorhanden) oder frischer Clone von mattpocock/skills
MP=~/.claude/plugins/marketplaces/mattpocock
git -C "$MP" fetch origin -q
# Was hat sich seit der Baseline an den vendorten Skills getan?
git -C "$MP" log --oneline 9603c1c..origin/main -- \
  skills/engineering/tdd skills/engineering/code-review \
  skills/engineering/codebase-design skills/engineering/improve-codebase-architecture
```

Bei relevanten Änderungen: Dateien neu kopieren (ohne `agents/`), die Baseline-SHA oben
aktualisieren und die repo-lokalen Anpassungen erneut anwenden (aktuell: in `tdd/SKILL.md`
zeigt der Refactor-Hinweis auf den Skill `code-review`).
