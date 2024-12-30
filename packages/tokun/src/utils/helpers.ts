import {
  BorderToken,
  DimensionToken,
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
import { tokenReferenceRegex } from "./regexes.js";
import { Transform } from "./types.js";

/**
 * The unallowed characters in token or group name.
 *
 * @link https://tr.designtokens.org/format/#character-restrictions
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
 *
 * @param value - The value to check.
 * @returns The result of the check.
 * @link https://tr.designtokens.org/format/#character-restrictions
 */
export function hasUnallowedCharactersInName(value: string) {
  return (
    UNALLOWED_CHARACTERS_IN_NAME.some((char) => value.includes(char)) &&
    DTCG_KEYS.every((key) => value !== key)
  );
}

/**
 * Check if the object is a token.
 *
 * @param obj - The object to check.
 * @returns The result of the check.
 * @link https://tr.designtokens.org/format/#additional-group-properties
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
export function stringifyDimensionValue(value: DimensionToken["$value"]) {
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
