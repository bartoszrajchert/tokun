import {
  BorderToken,
  DimensionToken,
  DurationToken,
  GradientToken,
  JsonPointerReference,
  JsonPointerReferenceObject,
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
  "$ref",
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
  return obj.hasOwnProperty("$value") || obj.hasOwnProperty("$ref");
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
 * Check if the value is a JSON Pointer reference object.
 */
export function isJsonPointerReferenceObject(
  value: unknown,
): value is JsonPointerReferenceObject {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== "$ref") {
    return false;
  }

  return isJsonPointerReference((value as { $ref?: unknown }).$ref);
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
  return isReference(value) || isJsonPointerReferenceObject(value);
}

/**
 * Return token's logical value representation.
 */
export function getTokenValue(token: Token): TokenValue | TokenReference {
  if ("$value" in token) {
    return token.$value as TokenValue;
  }

  return {
    $ref: token.$ref as JsonPointerReference,
  };
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
 * Convert JSON Pointer to flattened token path when possible.
 */
export function pointerToTokenPath(pointer: JsonPointerReference): string {
  const segments = decodeJsonPointer(pointer);
  const valueIndex = segments.indexOf("$value");

  if (valueIndex > 0) {
    return segments.slice(0, valueIndex).join(".");
  }

  return segments.join(".");
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

function stringifyScalarOrPointer(
  value: string | number | JsonPointerReferenceObject,
) {
  if (isJsonPointerReferenceObject(value)) {
    return value.$ref;
  }

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

  if (isJsonPointerReferenceObject(value)) {
    return value.$ref;
  }

  if (typeof value === "object" && value !== null) {
    return `${stringifyScalarOrPointer(value.value)}${stringifyScalarOrPointer(value.unit)}`;
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
    throw new Error(`${name} not found.`);
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
