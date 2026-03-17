---
name: dtcg-2025-10-resolver
description: Implement the DTCG Resolver Module 2025.10 exactly for sets, modifiers, inputs, references, and resolution ordering.
compatibility: opencode
---

## Use when

Loading resolver documents and producing resolved token outputs for one or more context permutations.

If `dtcg-2025-10-core` detects a newer published TR version, update this skill's versioned references before use.

## Authoritative references

- `https://www.designtokens.org/tr/2025.10/resolver/`
- `https://www.designtokens.org/schemas/2025.10/resolver.json`
- Local schema mirror: `../dtcg-2025-10-core/schemas/2025.10/resolver.json`
- Normative checklist index: `requirements.normative.json`

Use `requirements.normative.json` as an index of statements; confirm each decision against the canonical TR section text.

## Critical implementation requirements

- Root `version` is required and MUST equal `2025.10`.
- Root `resolutionOrder` is required.
- Sets MUST define `sources`; array order is significant (last conflict wins).
- Modifiers MUST define non-empty `contexts`; tools MUST error on 0 contexts.
- Modifiers MAY reference sets, but MUST NOT reference modifiers.
- Only `resolutionOrder` may reference `#/modifiers/...`.
- Nothing may reference `#/resolutionOrder/...`.
- Inline set/modifier entries in `resolutionOrder` MUST include `name` and `type` and use unique names within the array.
- `default` context values MUST exist in modifier `contexts`.
- Reference objects MUST resolve and MUST NOT be circular.
- Inputs MUST be JSON-serializable objects with string values.
- Apply resolution stages in order:
  1. Input validation
  2. Resolution-order flattening
  3. Alias resolution (Format module rules)
  4. Final resolved output
- Preserve additional token properties (including `$extensions`) through resolution.
- Provide meaningful errors for invalid inputs, invalid references, and circular dependencies.

## Resolver behavior essentials

- Conflict strategy is deterministic: latest source occurrence wins.
- Alias resolution is deferred until after structure flattening.
- If no modifiers exist, skip input-validation modifier checks and continue with ordering.
