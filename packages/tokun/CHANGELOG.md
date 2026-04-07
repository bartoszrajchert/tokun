# tokun

## 0.3.0

### Minor Changes

- 37b16be: ### Highlights

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

## 0.2.2

### Patch Changes

- 3c55e84: Fix recursive dir creation when using CLI
- f5b24b3: Fix `duration` transform
- 6c4ee11: Remove the need for redundant directory structure in config files, enhance error handling in composition tokens, add more unit tests

## 0.2.1

### Patch Changes

- d85f544: Remove `radash`, update `zod`
- edddd1c: Fix `dtcg-json-loader`, fix a bug related to composition tokens, minor adjustments

## 0.2.0

### Minor Changes

- 6f8b637: API changes:
  - Remove tinyglob from `build` method
  - Merge browser's and node's `build` method
  - Fix `defineConfig` method
  - Minor fixes
  - Export `toFlat`
- 076e809: Add file header

## 0.1.2

### Patch Changes

- 8b77b3c: Fix duration and transition token types with latest DTCG changes (27 Nov 2024), use "hasOwnProperty" instead of "Object.hasOwn" for better compatibility, don't generate sourcemap, target es6 syntax, export types
- 347d178: Split node and browser versions

## 0.1.1

### Patch Changes

- 21f3b7c: Fix bug which was on the 0.1.0 release.

## 0.1.0

### Minor Changes

- e4573ec: 🚀 Initialization!
