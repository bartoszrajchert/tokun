import {
  BorderToken,
  DimensionToken,
  DurationToken,
  GradientToken,
  ReferenceValue,
  ShadowToken,
  StrokeStyleToken,
  Token,
  TokenCompositeValue,
  TokenType,
  TokenValue,
  TransitionToken,
  TypographyToken,
} from "types/definitions.js";
import { Transform } from "./types.js";

/**
 * The unallowed characters in token or group name.
 * Reference: https://tr.designtokens.org/format/#character-restrictions
 */
export const UNALLOWED_CHARACTERS_IN_NAME = ["{", "}", ".", "$"];

/**
 * The keys of the Design Tokens Community Group Format.
 */
export const DTCG_KEYS = ["$value", "$type", "$description", "$extensions"];

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
 * Check if the value has unallowed characters in the name.
 * Reference: https://tr.designtokens.org/format/#character-restrictions
 *
 * @param value - The value to check.
 * @returns The result of the check.
 */
export function hasUnallowedCharactersInName(value: string) {
  return (
    UNALLOWED_CHARACTERS_IN_NAME.some((char) => value.includes(char)) &&
    DTCG_KEYS.every((key) => value !== key)
  );
}

/**
 * Check if the object is a token.
 * Reference: https://tr.designtokens.org/format/#additional-group-properties
 *
 * @param obj - The object to check.
 * @returns The result of the check.
 */
export function isToken(obj: object): obj is Token {
  return obj.hasOwnProperty("$value");
}

/**
 * Check if the value is composite.
 * It can be an object or an array of objects.
 *
 * @param value - The value to check.
 * @returns Boolean value.
 */
export function isValueComposite(
  value: TokenValue,
): value is TokenCompositeValue {
  if (Array.isArray(value)) {
    return value.every(
      (v) => (typeof v === "object" && value !== null) || isReference(v), // TODO: Check if it should be isReference(v)
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
 * Check if the value is a reference.
 *
 * @param value - The $value parameter of the Token.
 * @see Token
 * @returns The result of the check.
 */
export function isReference(value: any): value is ReferenceValue {
  return typeof value === "string" && tokenReferenceRegex.test(value);
}

/**
 * Unwrap the reference.
 *
 * @param value - The value parameter of the Token.
 * @see Token
 * @returns The unwrapped reference.
 */
export function unwrapReference(value: any): string {
  if (!isReference(value)) {
    throw new Error(`The token is not a reference. Got ${value}`);
  }

  return value.replace("{", "").replace("}", "");
}

/**
 * Type guard to distinguish between the two possible types of transformer and handle them appropriately.
 *
 * @param transform - The transform to check.
 * @param input - The input to transform.
 * @returns The result of the transformation.
 */
export function applyTransform(transform: Transform, input: string | Token) {
  if (transform.type === "token") {
    // Ensure input is TokenInfo
    if (typeof input !== "string") {
      return transform.transformer(input);
    } else {
      throw new Error("Expected TokenInfo input for token transformer");
    }
  } else if (transform.type === "name") {
    // Ensure input is string
    if (typeof input === "string") {
      return transform.transformer(input);
    } else {
      throw new Error("Expected string input for name transformer");
    }
  }
}

/**
 * Stringify the value of the dimension token.
 *
 * @param value - The value of the dimension token.
 * @returns The stringified value.
 */
export function stringifyUnitValue(
  value: DimensionToken["$value"] | DurationToken["$value"],
) {
  if (typeof value === "object" && value !== null) {
    return `${value.value}${value.unit}`;
  }

  return value;
}

/**
 * Replace the Map with an object.
 * Used in JSON.stringify.
 */
export function replacer(_: any, value: any) {
  if (value instanceof Map) {
    return Array.from(value.entries()).reduce((acc: any, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  } else {
    return value;
  }
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
 * Regex for token reference.
 *
 * Explanation:
 * - `^` asserts the start of a line.
 * - `\{` matches the character `{` literally.
 * - `[a-zA-Z0-9\s@_-]+` matches any character in the range `a-z`, `A-Z`, `0-9`, whitespace, `@`, `_`, `-` one or more times.
 * - `(?:\.[a-zA-Z0-9\s@_-]+)*` non-capturing group that matches any character in the range `a-z`, `A-Z`, `0-9`, whitespace, `@`, `_`, `-` one or more times, zero or more times.
 * - `\}` matches the character `}` literally.
 * - `$` asserts the end of a line.
 *
 * @example
 * ```ts
 * tokenReferenceRegex.test("{brand.color.core}"); // true
 * tokenReferenceRegex.test("{@typography_primitives.Scale 03}"); // true
 * tokenReferenceRegex.test("{brand.color.unknown"); // false
 * ```
 */
export const tokenReferenceRegex =
  /^\{[a-zA-Z0-9\s@_-]+(?:\.[a-zA-Z0-9\s@_-]+)*\}$/;

/**
 * Regex for hex color with alpha.
 *
 * Explanation:
 * - `#` matches the character `#` literally.
 * - `([A-Fa-f0-9]{3}){1,2}` matches any character in the range `A-F`, `a-f`, or `0-9` three times, one or two times.
 * - `\b` asserts a word boundary.
 * - `|` or.
 * - `#` matches the character `#` literally.
 * - `([A-Fa-f0-9]{4}){1,2}` matches any character in the range `A-F`, `a-f`, or `0-9` four times, one or two times.
 * - `\b` asserts a word boundary.
 *
 * @example
 * ```ts
 * hexColorWithAlphaRegex.test("#000000"); // true
 * hexColorWithAlphaRegex.test("#000"); // true
 * hexColorWithAlphaRegex.test("#000000ff"); // true
 * hexColorWithAlphaRegex.test("#000f"); // true
 * ```
 */
export const hexColorWithAlphaRegex =
  /#([A-Fa-f0-9]{3}){1,2}\b|#([A-Fa-f0-9]{4}){1,2}\b/;
