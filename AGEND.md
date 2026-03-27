# AGEND

AGEND is the alignment and governance checklist for this repository.
Its purpose is to keep code, architecture docs, and agent skills in sync.

## Always-update policy

When anything meaningful changes, update AGEND and linked docs in the same change.
"Meaningful" includes structure, workflow, public API, CLI behavior, validation behavior, and agent-skill behavior.

## Alignment checklist (Definition of Done)

- [ ] Code or config changes are reflected in `ARCHITECTURE.md` if topology/workflow changed.
- [ ] DTCG-related behavior changes are reflected in `.agents/skills/dtcg-2025-10/SKILL.md`.
- [ ] DTCG normative or schema source changes are reflected in `.agents/skills/dtcg-2025-10/references/requirements/` and `.agents/skills/dtcg-2025-10/references/schemas/`.
- [ ] TypeScript workflow or strictness guidance changes are reflected in `.agents/skills/typescript/SKILL.md`.
- [ ] Shared-skill compatibility still works (`.agents/skills` canonical, `.claude/skills` and `.opencode/skills` symlinked).
- [ ] Any exceptions are documented in this file under "Open alignment items".

## Update matrix

| Change type                                     | Must update                                                                                                                                                                        |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace layout, new package/app, folder moves | `ARCHITECTURE.md`, `AGEND.md`                                                                                                                                                      |
| Build/test/release pipeline changes             | `ARCHITECTURE.md`, `AGEND.md`                                                                                                                                                      |
| CLI command behavior changes                    | `ARCHITECTURE.md`, `AGEND.md`, related docs                                                                                                                                        |
| DTCG validation/resolution behavior changes     | `.agents/skills/dtcg-2025-10/SKILL.md`, `ARCHITECTURE.md`, `AGEND.md`                                                                                                              |
| DTCG source/version changes                     | `.agents/skills/dtcg-2025-10/SKILL.md`, `.agents/skills/dtcg-2025-10/references/requirements/*`, `.agents/skills/dtcg-2025-10/references/schemas/*`, `ARCHITECTURE.md`, `AGEND.md` |
| TypeScript workflow/strictness guidance changes | `.agents/skills/typescript/SKILL.md`, `ARCHITECTURE.md`, `AGEND.md`                                                                                                                |
| Skill folder layout or interoperability changes | `.agents/skills/README.md`, `ARCHITECTURE.md`, `AGEND.md`                                                                                                                          |

## Current baseline

- Consolidated skills:
  - `.agents/skills/dtcg-2025-10/`
  - `.agents/skills/typescript/`
- Canonical skills root: `.agents/skills`
- DTCG reference normalization treats root-token aliases (`{group.$root}`) and pointers (`#/group/$root`) as the same flattened token target.
- Compatibility links:
  - `.claude/skills` -> `../.agents/skills`
  - `.opencode/skills` -> `../.agents/skills`

## Open alignment items

- None.

## Last reviewed

- 2026-03-27
