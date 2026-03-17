---
name: dtcg-2025-10-core
description: Build design-token tooling that is strictly aligned with DTCG Technical Reports 2025.10 (Format, Color, Resolver) and schemas.
compatibility: opencode
---

## Purpose

Use this skill whenever implementing, validating, transforming, or resolving DTCG design token data.

## Source Of Truth (authoritative)

- `https://www.designtokens.org/tr/2025.10/`
- `https://www.designtokens.org/tr/2025.10/format/`
- `https://www.designtokens.org/tr/2025.10/color/`
- `https://www.designtokens.org/tr/2025.10/resolver/`
- `https://www.designtokens.org/schemas/2025.10/format.json`
- `https://www.designtokens.org/schemas/2025.10/resolver.json`

A local mirror of the full 2025.10 schema graph is included in `schemas/2025.10/`.

## Version freshness (mandatory)

Before using this pack, check the TR index for a newer published version:

- `https://www.designtokens.org/technical-reports/`

If a newer stable TR version exists, update this pack first, then continue:

1. Update module/source URLs in all skill files to the newer version.
2. Refresh `requirements.normative.json` for format/color/resolver from the newer module pages.
3. Refresh mirrored schemas under `schemas/<new-version>/` and use those for validation.
4. Do not mix versions within one conformance run.

## Mandatory process

1. Load `dtcg-2025-10-format` for DTCG file format parsing/validation/export.
2. Load `dtcg-2025-10-color` for color token parsing/validation/transform.
3. Load `dtcg-2025-10-resolver` for context-based resolution.
4. Treat each module's `requirements.normative.json` as the normative checklist extracted from the module TR.
5. Enforce all `MUST` and `MUST NOT` requirements.
6. Enforce `SHOULD` and `SHOULD NOT` unless there is an explicit, documented reason not to.
7. Validate against schemas, then run semantic checks not expressible in JSON Schema.
8. Produce conformance output by section anchor with pass/fail and rationale.

Use each `requirements.normative.json` as an index, then verify against the linked TR section text before deciding final conformance behavior.

## Hard constraints

- Do not invent properties, token types, syntax, or resolver behavior.
- Do not silently coerce invalid input unless the spec explicitly defines fallback behavior.
- Preserve unknown `$extensions` data on read/write.
- Keep non-normative guidance separate from normative conformance decisions.

## Non-normative boundaries (guidance only)

- Format: section 2 Introduction; all authoring guidelines, diagrams, examples, and notes.
- Color: section 5 Gamut mapping, section 6 Interpolation, section 7 Token naming.
- Resolver: section 1 Introduction, section 2.1 Orthogonality, section 7 Bundling, acknowledgements.
