import {
  BorderToken,
  DimensionToken,
  DurationToken,
  GradientToken,
  JsonPointerReference,
  ReferenceValue,
  ShadowToken,
  StrokeStyleToken,
  Token,
  TokenCompositeValue,
  TokenReference,
  TokenType,
  TokenValue,
  TransitionToken,
  TypographyToken,
} from "types/definitions.js";
import { Transform } from "./types.js";

/**
 * The disallowed characters in token/group names.
 * Reference: https://www.designtokens.org/TR/2025.10/format/#x5-1-1-character-restrictions
 */
export const UNALLOWED_CHARACTERS_IN_NAME = ["{", "}", "."];

/**
 * Reserved keys in DTCG objects.
 */
export const DTCG_KEYS = [
  "$value",
  "$type",
  "$description",
  "$extensions",
  "$deprecated",
  "$extends",
  "$root",
  "$schema",
];

export const TOKEN_TYPES: TokenType[] = [
  "number",
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "duration",
  "cubicBezier",
  "transition",
  "shadow",
  "gradient",
  "typography",
  "strokeStyle",
  "border",
];

export const COMPOSITE_TOKEN_TYPES: TokenType[] = [
  "transition",
  "shadow",
  "gradient",
  "typography",
  "strokeStyle",
  "border",
];

/**
 * Check if the value has disallowed characters in token/group name.
 */
export function hasUnallowedCharactersInName(value: string) {
  if (value.length === 0) {
    return true;
  }

  if (DTCG_KEYS.includes(value)) {
    return false;
  }

  if (value.startsWith("$")) {
    return true;
  }

  return UNALLOWED_CHARACTERS_IN_NAME.some((char) => value.includes(char));
}

/**
 * Check if the object is a token.
 */
export function isToken(obj: object): obj is Token {
  return obj.hasOwnProperty("$value");
}

/**
 * Check if the value is a curly-brace reference.
 */
export function isReference(value: unknown): value is ReferenceValue {
  return typeof value === "string" && tokenReferenceRegex.test(value);
}

/**
 * Check if the value is a token value reference.
 */
export function isTokenReference(value: unknown): value is TokenReference {
  return isReference(value);
}

/**
 * Return token's logical value representation.
 */
export function getTokenValue(token: Token): TokenValue | TokenReference {
  if (!("$value" in token)) {
    throw new Error("Invalid token: missing $value. $ref is not supported.");
  }

  return token.$value as TokenValue;
}

/**
 * Check if the value is a JSON Pointer reference string.
 */
export function isJsonPointerReference(
  value: unknown,
): value is JsonPointerReference {
  return typeof value === "string" && jsonPointerReferenceRegex.test(value);
}

/**
 * Unwrap a curly-brace reference.
 */
export function unwrapReference(value: unknown): string {
  if (!isReference(value)) {
    throw new Error(`The token is not a reference. Got ${value}`);
  }

  return value.slice(1, -1);
}

/**
 * Normalize flattened token map paths for `$root` tokens.
 *
 * In flattened maps, `$root` tokens are stored under their parent group path.
 * Example: `brand.color.$root` becomes `brand.color`.
 */
export function normalizeRootTokenPath(path: string): string {
  if (path === "$root") {
    return "";
  }

  if (path.endsWith(".$root")) {
    return path.slice(0, -".$root".length);
  }

  return path;
}

/**
 * Decode JSON Pointer into path segments.
 */
export function decodeJsonPointer(pointer: string): string[] {
  if (!isJsonPointerReference(pointer)) {
    throw new Error(`Invalid JSON Pointer reference: ${pointer}`);
  }

  const raw = pointer.slice(2);
  if (raw === "") {
    return [];
  }

  return raw
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

/**
 * Resolve a value from JSON Pointer.
 */
export function getByJsonPointer(root: unknown, pointer: string): unknown {
  const segments = decodeJsonPointer(pointer);
  let current: unknown = root;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0) {
        return undefined;
      }
      current = current[index];
    } else if (typeof current === "object" && current !== null) {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }

    if (current === undefined) {
      return undefined;
    }
  }

  return current;
}

/**
 * Check if the value is composite.
 */
export function isValueComposite(
  value: TokenValue,
): value is TokenCompositeValue {
  if (isTokenReference(value)) {
    return false;
  }

  if (Array.isArray(value)) {
    return value.every(
      (entry) =>
        isTokenReference(entry) ||
        (typeof entry === "object" && entry !== null && !Array.isArray(entry)),
    );
  }

  return typeof value === "object" && value !== null;
}

export function isTokenComposite(
  value: Token,
): value is
  | TransitionToken
  | ShadowToken
  | GradientToken
  | TypographyToken
  | BorderToken
  | StrokeStyleToken {
  if (!value.$type) {
    return false;
  }

  return COMPOSITE_TOKEN_TYPES.includes(value.$type);
}

/**
 * Type guard to distinguish transformer input kinds.
 */
export function applyTransform(transform: Transform, input: string | Token) {
  if (transform.type === "token") {
    if (typeof input !== "string") {
      return transform.transformer(input);
    }
    throw new Error("Expected Token input for token transformer");
  }

  if (typeof input === "string") {
    return transform.transformer(input);
  }

  throw new Error("Expected string input for name transformer");
}

function stringifyScalar(value: string | number) {
  return String(value);
}

/**
 * Stringify value/unit pair for dimension and duration values.
 */
export function stringifyUnitValue(
  value: DimensionToken["$value"] | DurationToken["$value"],
) {
  if (isReference(value)) {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    return `${stringifyScalar(value.value)}${stringifyScalar(value.unit)}`;
  }

  return String(value);
}

/**
 * Replace Map with plain object in JSON.stringify.
 */
export function replacer(_: unknown, value: unknown) {
  if (value instanceof Map) {
    return Array.from(value.entries()).reduce(
      (acc: Record<string, unknown>, [key, mapValue]) => {
        acc[key] = mapValue;
        return acc;
      },
      {},
    );
  }

  return value;
}

export const findInRegistry = <T>(
  name: string,
  registry: (T & { name: string })[],
): T => {
  const found = registry.find((reg) => reg.name === name);

  if (!found) {
    throw new Error(`${name} not found in the registry.`);
  }

  return found;
};

/**
 * Curly-brace reference syntax.
 * Supports regular token names and explicit $root path segments.
 */
export const tokenReferenceRegex =
  /^\{(?:\$root|[^${}.][^{}.]*)(?:\.(?:\$root|[^${}.][^{}.]*))*\}$/;

/**
 * JSON Pointer URI fragment syntax.
 */
export const jsonPointerReferenceRegex = /^#\/.*/;

/**
 * 6-digit CSS hex fallback used by DTCG color.
 */
export const hexColorWithAlphaRegex = /^#[A-Fa-f0-9]{6}$/;
