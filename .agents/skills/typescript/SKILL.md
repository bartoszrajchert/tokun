---
name: typescript
description: "Implement and review TypeScript changes across this monorepo with strict typing, Bun/Turbo workflows, and predictable API evolution."
---

## Use when

Use this skill for any TypeScript or TS config task: `.ts`/`.tsx` changes, type errors, module resolution issues, declaration output issues, and exported type/API design.

## Repository baseline (authoritative)

- Package manager/runtime: `bun`.
- Workspace orchestration: Turborepo (`bun run build`, `bun run test`, `bun run lint`, `bun run typedoc`).
- `packages/tokun`:
  - ESM package (`"type": "module"`) with `module` + `moduleResolution` set to `NodeNext`.
  - `strict: true`, `noUncheckedIndexedAccess: true`, `isolatedModules: true`.
  - Type declarations produced from `tsconfig.build.json`.
- `apps/www`:
  - Next.js + TypeScript with `strict: true`, `moduleResolution: bundler`, `noEmit: true`.

## Progressive disclosure map

- `references/tsconfig-strict-template.md` for strict TSConfig overlays (NodeNext library + Next.js app variants).
- `references/type-pattern-cheatsheet.md` for preferred type patterns and anti-pattern replacements.

Apply templates as overlays, not blind replacements. Preserve package-specific module settings and build behavior.

## Core rules (strict-by-default)

- Keep strict guarantees intact; do not relax compiler options unless explicitly requested.
- Do not introduce `any`; prefer `unknown` with narrowing, generics, or discriminated unions.
- Prefer const-object-plus-derived-union for finite runtime values.
  - Pattern: `const STATUS = { ... } as const` and `type Status = (typeof STATUS)[keyof typeof STATUS]`.
- Prefer `satisfies` for config-like objects to validate shape without widening literal types.
- Use `import type` and inline `type` imports when only type information is needed.
- Validate external input at runtime before trusting static types.

## Type design guidance

- Keep interfaces/types small and composable; extract reused nested object shapes into named types.
- Use discriminated unions for state/results and enforce exhaustiveness with `never`.
- Reserve branded/nominal types for high-risk identifiers (IDs, units, tokens).
- Avoid deep type gymnastics unless the benefit clearly outweighs maintenance cost.
- Prefer explicit return types for exported/public APIs.

## Monorepo workflow (checklist)

- [ ] Detect scope (`packages/tokun`, `apps/www`, or both) and follow local tsconfig/module conventions.
- [ ] Implement the minimal safe change first.
- [ ] Validate with existing project scripts before adding custom commands.
- [ ] Run one-shot checks (avoid watch mode):
  - `bunx tsc -p packages/tokun/tsconfig.build.json --noEmit`
  - `bunx tsc -p apps/www/tsconfig.json --noEmit`
- [ ] If behavior/output changed, run relevant workspace checks (`bun run test`, `bun run build` when needed).

## Common failure modes

- Path aliases compile but fail at runtime because runtime resolvers are not configured.
- NodeNext projects accidentally mixing ESM/CJS assumptions.
- Silencing real mismatches with broad `as` assertions.
- Recursive conditional/mapped types causing type instantiation depth/perf issues.

## Repository alignment (mandatory)

When this skill or skill layout changes, update these files in the same change:

- `ARCHITECTURE.md`
- `AGEND.md`
- `.agents/skills/README.md` (if skill discovery/layout changes)

## Upstream inspirations

- `https://agentskill.sh/@dicklesworthstone/typescript-expert`
- `https://agentskill.sh/@josecortezz25/typescript`
- `https://agentskill.sh/@majiayu000/typescript-expert`
- `https://agentskill.sh/@neversight/typescript`
- `https://agentskill.sh/@sickn33/javascript-typescript-typescript-scaffold`
