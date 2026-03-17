---
name: dtcg-2025-10-color
description: Implement the DTCG Color Module 2025.10 exactly, including color spaces, component constraints, alpha, and hex fallback rules.
compatibility: opencode
---

## Use when

Validating, transforming, importing, exporting, or resolving `$type: "color"` token values.

If `dtcg-2025-10-core` detects a newer published TR version, update this skill's versioned references before use.

## Authoritative references

- `https://www.designtokens.org/tr/2025.10/color/`
- `https://www.designtokens.org/schemas/2025.10/format/values/color.json`
- Local schema mirror: `../dtcg-2025-10-core/schemas/2025.10/format/values/color.json`
- Normative checklist index: `requirements.normative.json`

Use `requirements.normative.json` as an index of statements; confirm each decision against the canonical TR section text.

## Critical implementation requirements

- `$type` MUST be `color`.
- `$value` MUST include `colorSpace` and `components`.
- Each `components` item MUST be either a number or `"none"`.
- `alpha` is optional; if omitted, assume `1`.
- `hex` is optional fallback and MUST be 6-digit CSS hex notation.
- Enforce component bounds and shape per `colorSpace`.
- Support and preserve `"none"` semantics for missing/non-applicable components.
- Do not accept unsupported color spaces beyond 2025.10 list unless explicitly extending outside spec mode.

## Supported 2025.10 color spaces

- `srgb`
- `srgb-linear`
- `hsl`
- `hwb`
- `lab`
- `lch`
- `oklab`
- `oklch`
- `display-p3`
- `a98-rgb`
- `prophoto-rgb`
- `rec2020`
- `xyz-d65`
- `xyz-d50`

## Notes

- Section 5 (Gamut mapping), section 6 (Interpolation), and section 7 (Token naming) are non-normative guidance.
