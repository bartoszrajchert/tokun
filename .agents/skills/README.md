# Agent Skills

This directory contains consolidated, project-aligned agent skills.

## Skills

- `dtcg-2025-10` - DTCG 2025.10 conformance implementation and auditing.
- `typescript` - TypeScript engineering workflow for this monorepo.

## Skill layout

- `<skill>/SKILL.md` - instructions and metadata
- `<skill>/references/` - optional requirement indexes, mirrors, or research trace
- `<skill>/scripts/` - optional executable automation
- `<skill>/assets/` - optional reusable templates/resources

## Cross-agent compatibility (no duplicated content)

- Canonical location: `.agents/skills`
- `.opencode/skills` -> symlink to `.agents/skills`
- `.claude/skills` -> symlink to `.agents/skills`

This keeps one canonical source of skill content while exposing it to compatible agent/tool discovery paths.

## Alignment governance

- Repository architecture source: `ARCHITECTURE.md`
- Alignment checklist source: `AGEND.md`

Update both whenever skill layout or skill workflows change.
