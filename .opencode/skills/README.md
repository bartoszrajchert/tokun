# DTCG 2025.10 Skill Pack

This directory contains OpenCode skills for implementing design-token tooling aligned to:

- https://www.designtokens.org/tr/2025.10/

## Skills

- `dtcg-2025-10-core`
- `dtcg-2025-10-format`
- `dtcg-2025-10-color`
- `dtcg-2025-10-resolver`

## Data included

- Module-level normative requirement inventories (`requirements.normative.json`) extracted from the published TR module HTML pages (use as indexes, then verify against TR section text).
- Full schema graph mirror for `format` and `resolver` under `dtcg-2025-10-core/schemas/2025.10/`.
- Research trace and source URL manifest in `dtcg-2025-10-core/RESEARCH.md`.

## Cross-agent compatibility (no duplicated content)

- `.claude/skills` -> symlink to `.opencode/skills`
- `.agents/skills` -> symlink to `.opencode/skills`

This keeps one canonical source of skill content while exposing it to other compatible agent/tool discovery paths.

## Recommended load order

1. `dtcg-2025-10-core`
2. `dtcg-2025-10-format`
3. `dtcg-2025-10-color` (when color tokens are in scope)
4. `dtcg-2025-10-resolver` (when resolver documents are in scope)
