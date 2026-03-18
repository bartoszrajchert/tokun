# DTCG 2025.10 Skill

This directory contains a single consolidated DTCG skill aligned to:

- https://www.designtokens.org/tr/2025.10/

## Skill

- `dtcg-2025-10`

## Skill layout

- `dtcg-2025-10/SKILL.md` - instructions and metadata
- `dtcg-2025-10/references/` - normative indexes, schema mirrors, research trace
- `dtcg-2025-10/scripts/` - optional executable automation
- `dtcg-2025-10/assets/` - reusable report/template resources

## Cross-agent compatibility (no duplicated content)

- Canonical location: `.agents/skills`
- `.opencode/skills` -> symlink to `.agents/skills`
- `.claude/skills` -> symlink to `.agents/skills`

This keeps one canonical source of skill content while exposing it to compatible agent/tool discovery paths.

## Alignment governance

- Repository architecture source: `ARCHITECTURE.md`
- Alignment checklist source: `AGEND.md`

Update both whenever the skill layout or DTCG conformance workflow changes.
