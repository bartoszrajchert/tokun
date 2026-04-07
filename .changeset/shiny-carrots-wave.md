---
"tokun": minor
---

### Highlights

- Migrate build tooling to Bun and split output into dedicated Node and browser bundles.
- Add first-class browser consumption via `tokun/browser` and browser-safe `tokun/validators` exports.
- Rework the CLI to be CI-friendly: remove interactive runtime dependencies, improve argument parsing, and align logging flags (`--silent`, `--verbose`, `--no-warn`) with API log controls.
- Enforce stricter DTCG handling across loader/validator/build flows, including normalized root-token references and more predictable token resolution behavior.
- Improve CSS and SCSS output for structured color values and value stringification.
- Move token validation/runtime expectations to modern structured color values (`colorSpace` + `components`) and remove JSON Pointer `$ref` support for now.

### Internal Improvements

- Simplify config and builder internals to reduce repeated work and keep imports lean.
- Reduce package footprint and refresh build outputs for CLI and validator entry files.
- Upgrade dependencies (including Zod v4) and expand tests around transforms, validators, loader behavior, and CLI command paths.
- Harden release safety by upgrading the Vitest/Vite toolchain and pinning vulnerable transitive dependencies to patched versions.

### Migration Notes

- `tokun/utils` and `tokun/types` are no longer exported subpaths; import supported APIs from `tokun`, `tokun/browser`, or `tokun/validators`.
- Example template naming now uses `simple` (formerly `basic`).
