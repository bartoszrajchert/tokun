---
name: dtcg-2025-10
description: "Implement and audit DTCG 2025.10 token tooling across Format, Color, and Resolver modules. Use when validating, resolving, or transforming design token data for strict 2025.10 conformance."
---

## Use when

Use this skill for any DTCG 2025.10 task: parsing token files, validating format/color/resolver behavior, resolving contexts, or generating conformance reports.

## Source of truth (authoritative)

- `https://www.designtokens.org/tr/2025.10/`
- `https://www.designtokens.org/tr/2025.10/format/`
- `https://www.designtokens.org/tr/2025.10/color/`
- `https://www.designtokens.org/tr/2025.10/resolver/`
- `https://www.designtokens.org/schemas/2025.10/format.json`
- `https://www.designtokens.org/schemas/2025.10/resolver.json`

Local mirrors and requirement indexes are bundled under `references/`.

## Progressive disclosure map

Load only what is needed for the task:

- `references/requirements/format.normative.json` for format conformance decisions.
- `references/requirements/color.normative.json` when `$type: "color"` is in scope.
- `references/requirements/resolver.normative.json` when resolver documents are in scope.
- `references/schemas/2025.10/format.json` for format schema validation.
- `references/schemas/2025.10/resolver.json` for resolver schema validation.
- `references/RESEARCH.md` only when provenance or source extraction details are needed.
- `assets/conformance-report-template.md` when producing final conformance output.

Use each `*.normative.json` as an index. Confirm final conformance behavior against the linked TR section text.

## Version freshness (mandatory)

Before starting conformance work, check:

- `https://www.designtokens.org/technical-reports/`

If a newer stable TR exists, update references, requirement indexes, and schema mirrors first. Do not mix versions in one conformance run.

## Repository alignment (mandatory)

When this skill, its references, or DTCG conformance behavior changes, update these repository documents in the same change:

- `ARCHITECTURE.md`
- `AGEND.md`
- `.agents/skills/README.md` (if discovery layout or compatibility links changed)

## Default workflow (checklist)

- [ ] Identify scope: `format`, `color`, `resolver`, or a combination.
- [ ] Validate structure with the corresponding schema mirror(s).
- [ ] Apply semantic checks not expressible in JSON Schema.
- [ ] Resolve references/ordering with module-specific rules.
- [ ] Re-run validation until all checks pass.
- [ ] Produce conformance report from `assets/conformance-report-template.md`.

## Critical requirements by module

### Format essentials

- Detect token vs group by `$value` presence.
- Enforce names: no leading `$`, no `{`, `}`, or `.`.
- Support both reference syntaxes: curly aliases and JSON Pointer `$ref`.
- Enforce type determination order exactly: explicit `$type` -> referenced token type -> nearest parent group `$type` -> invalid.
- Never infer token type by value shape alone.
- Implement chaining and cycle detection across aliases, `$extends`, and `$ref`.
- Preserve unknown `$extensions` data during read/write.

### Color essentials

- `$type` must be `color`.
- `$value` must include `colorSpace` and `components`.
- Each component must be a number or `"none"`.
- `alpha` is optional; default is `1`.
- `hex` is optional fallback and must be 6-digit CSS hex.
- Enforce component bounds and structure by color space.

### Resolver essentials

- Root `version` must exist and equal `2025.10`.
- Root `resolutionOrder` is required.
- Sets must define ordered `sources` (last conflict wins).
- Modifiers must define non-empty `contexts`.
- Modifiers may reference sets, never modifiers.
- Only `resolutionOrder` may reference `#/modifiers/...`.
- Nothing may reference `#/resolutionOrder/...`.
- Apply stages in order: input validation -> flattening -> alias resolution -> final output.

## Gotchas

- Do not silently coerce invalid values unless the spec defines fallback behavior.
- Keep normative requirements separate from non-normative guidance.
- Non-normative sections: Format section 2; Color sections 5-7; Resolver sections 1, 2.1, and 7.
- Preserve additional token properties (including `$extensions`) through transforms and resolution.

## Validation loop

1. Make implementation or data changes.
2. Validate with schema mirror(s).
3. Validate semantics with `references/requirements/*.normative.json` plus TR section text.
4. If anything fails, fix and repeat from step 2.
5. Finalize only when all schema and semantic checks pass.

## Output requirement

Final conformance output must include section-anchor-level pass/fail status plus rationale, using `assets/conformance-report-template.md`.
