# Tokun Architecture

## Purpose

This document is the canonical architecture map for the repository.
When structure, workflows, or agent-skill behavior changes, update this file in the same change.

## Monorepo topology

```
tokun/
|- apps/
|  `- www/                  # Next.js docs and playground app
|- packages/
|  `- tokun/                # Core library + CLI package
|- examples/                # Runnable usage examples
|- .agents/
|  `- skills/
|     |- dtcg-2025-10/      # DTCG conformance skill
|     `- typescript/        # TypeScript engineering skill
|- .claude/skills -> ../.agents/skills
`- .opencode/skills -> ../.agents/skills
```

## Core components

### 1) `packages/tokun` (product runtime)

- Provides the published `tokun` package (library + CLI binary).
- Main code lives in `packages/tokun/src/`.
- Public domains:
  - `builder/` for token build pipelines (formats, loaders, transforms)
  - `validators/` for DTCG validation and schemas
  - `utils/` shared utilities and registry helpers
  - `types/` typed config and exported definitions
  - `cli/` commands (`build`, `validate`)

### 2) `apps/www` (documentation surface)

- Next.js application used for docs and playground.
- API docs content is generated into `apps/www/app/docs/content/api/`.
- Depends on workspace package `tokun` for examples and references.

### 3) `examples` (integration samples)

- Example configs and commands that run against local workspace `tokun`.

### 4) `.agents/skills` (agent skill system)

- Canonical root for repository-specific skills.
- Current skills:
  - `dtcg-2025-10/` for DTCG 2025.10 conformance workflow.
  - `typescript/` for TypeScript implementation and validation workflow.
- Skill layout pattern:
  - `SKILL.md` for activation instructions and guardrails
  - `references/` for optional requirement indexes and research trace
  - `assets/` for optional reusable templates
  - `scripts/` for optional reusable automation
- Shared by compatible clients via symlinks:
  - `.claude/skills`
  - `.opencode/skills`

## Build and task orchestration

- Root workspace orchestration uses Turborepo (`turbo.json`).
- Root scripts:
  - `build` -> `turbo build`
  - `test` -> `turbo test`
  - `lint` -> `turbo lint`
  - `typedoc` -> `turbo typedoc`
- Package-level build for `tokun` emits JS + type declarations into `packages/tokun/dist/`.

## DTCG conformance boundary

- Canonical external source: DTCG Technical Reports and schemas for version `2025.10`.
- Local mirrors and requirement indexes are stored in:
  - `.agents/skills/dtcg-2025-10/references/schemas/2025.10/`
  - `.agents/skills/dtcg-2025-10/references/requirements/`
- Conformance guidance for agents is centralized in:
  - `.agents/skills/dtcg-2025-10/SKILL.md`
- Format-module resolution normalizes `$root` token references to flattened paths:
  - Curly aliases ending with `.$root` resolve against the parent flattened token path.
  - JSON Pointer references targeting `/$root` map to the same flattened token path.

## Mandatory documentation update rule

For every structural or behavior change, update all impacted documents in the same PR/commit:

1. `ARCHITECTURE.md` (this file) for topology or system-flow changes
2. `AGEND.md` for alignment status and checklist updates
3. Relevant skill files under `.agents/skills/*/SKILL.md` (and related references/assets/scripts) when skill workflow or behavior changes

If no documentation update is needed, explicitly note why in the change description.

## Last reviewed

- 2026-03-27
