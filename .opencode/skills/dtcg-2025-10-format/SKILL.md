---
name: dtcg-2025-10-format
description: Implement and validate the DTCG Format Module 2025.10 exactly, including groups, aliases, types, and composite types.
compatibility: opencode
---

## Use when

Working with DTCG token files (`.tokens` or `.tokens.json`) for parsing, validation, reference resolution, type enforcement, or output generation.

If `dtcg-2025-10-core` detects a newer published TR version, update this skill's versioned references before use.

## Authoritative references

- `https://www.designtokens.org/tr/2025.10/format/`
- `https://www.designtokens.org/schemas/2025.10/format.json`
- Local schema mirror: `../dtcg-2025-10-core/schemas/2025.10/format.json`
- Normative checklist index: `requirements.normative.json`

Use `requirements.normative.json` as an index of statements; confirm each decision against the canonical TR section text.

## Critical implementation requirements

- Detect token vs group by `$value` presence.
- Enforce token/group name restrictions: names MUST NOT start with `$` and MUST NOT contain `{`, `}`, or `.`.
- Enforce media type support for both `application/design-tokens+json` and `application/json`.
- Enforce type determination order exactly: explicit token `$type` -> referenced token type -> nearest parent group `$type` -> invalid.
- Never infer type by value shape alone.
- Support both reference syntaxes:
  - Curly brace references for full token-value targeting.
  - JSON Pointer references via `$ref` (required support).
- Implement reference chaining and cycle detection.
- Implement group extension with `$extends` as JSON Schema `$ref`-equivalent behavior, including deep merge override semantics.
- Support `$root` root tokens and explicit `$root` pathing.
- Enforce all 2025.10 types and composite structures exactly.
- Preserve unknown `$extensions` content across tool round-trips.
- Apply token/group deprecation metadata behavior exactly.

## Types in scope for 2025.10

- Primitive/value types: `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`
- Composite types: `strokeStyle`, `border`, `transition`, `shadow`, `gradient`, `typography`

## Processing order requirements

- Group token resolution order: local tokens -> `$root` tokens -> `$extends` inherited tokens -> nested groups.
- Detect circular references across aliases, group extension, and JSON Pointer references.
