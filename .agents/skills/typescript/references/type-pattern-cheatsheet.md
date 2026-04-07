# Type Pattern Cheatsheet

Use these patterns by default in this repo.

## Runtime constants + derived union

```ts
const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];
```

Why: single source of truth for runtime values and compile-time union.

## `satisfies` for config objects

```ts
const pipeline = {
  entry: "src/index.ts",
  format: "esm",
} satisfies {
  entry: string;
  format: "esm" | "cjs";
};
```

Why: validates shape without widening literals.

## Prefer `unknown` over `any`

```ts
function parsePayload(value: unknown): ParsedPayload {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid payload");
  }
  return value as ParsedPayload;
}
```

Better: validate with Zod or type guards before casting.

## Type guard pattern

```ts
type User = { id: string; email: string };

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "email" in value
  );
}
```

## Discriminated unions + exhaustiveness

```ts
type Result<T> = { kind: "ok"; value: T } | { kind: "error"; message: string };

function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}

function unwrap<T>(result: Result<T>): T {
  switch (result.kind) {
    case "ok":
      return result.value;
    case "error":
      throw new Error(result.message);
    default:
      return assertNever(result);
  }
}
```

## Branded IDs for high-risk mixups

```ts
type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand };

type UserId = Brand<string, "UserId">;
type TokenSetId = Brand<string, "TokenSetId">;
```

Use when confusing IDs can cause data corruption.

## Import types explicitly

```ts
import type { BuildConfig } from "./types";
import { createBuilder, type Builder } from "./builder";
```

Why: keeps runtime imports clean under ESM/NodeNext.

## Index access with `noUncheckedIndexedAccess`

```ts
const first = values[0];
if (first === undefined) {
  throw new Error("Expected at least one value");
}
```

Do not assume array/dictionary keys always exist.

## Anti-pattern replacements

- `any` -> `unknown` + narrowing or generic constraints.
- Broad `as SomeType` -> runtime validation + narrow type.
- Giant nested inline object type -> named interfaces/types.
- Unbounded conditional recursion -> split types and cap complexity.
