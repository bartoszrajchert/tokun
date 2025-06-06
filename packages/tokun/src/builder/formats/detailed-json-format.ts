import {
  ReferenceValue,
  StrictToken,
  Token,
  TokenCompositeValue,
  TokenGroup,
  TokenGroupProperties,
  TokenType,
  TokenValue,
} from "types/definitions.js";
import {
  isReference,
  isValueComposite,
  replacer,
  unwrapReference,
} from "utils/helpers.js";
import { get } from "utils/object-utils.js";
import { traverseTokens } from "utils/traverse-tokens.js";
import { Format } from "utils/types.js";

/**
 * Detailed JSON formatter.
 */
export const detailedJsonFormat: Format = {
  name: "detailed-json",
  formatter: ({ tokens }) => {
    return JSON.stringify(toDetailed(Object.fromEntries(tokens)), replacer, 2);
  },
};

type ValueInfo<T> = T extends TokenType
  ? Extract<StrictToken, { $type: T }>["$value"]
  : any;

type DetailedTokens = Map<string, TokenInfo>;

type TokenInfo<T extends TokenType = any, V = ValueInfo<T>> = {
  type: T;
  value: V;
  description?: string;
  extensions?: Record<string, any>;
  resolvedValue: Exclude<V, ReferenceValue> | undefined;
  readonly original: Readonly<{
    path: string;
    value: V;
    resolvedValue: Exclude<V, ReferenceValue> | undefined;
  }>;
  readonly parentProperties?: Readonly<TokenGroupProperties>;
};

/**
 * Converts tokens and token groups into a flattened map (flatten notation).
 */
function toDetailed(obj: Token | TokenGroup): {
  detailed: DetailedTokens;
  warnings: string[];
} {
  const flatten: DetailedTokens = new Map();
  const warnings: string[] = [];
  const originalObj: Token | TokenGroup = Object.freeze(obj);

  traverseTokens(obj, {
    onToken(token, path, lastType, lastGroupProperties) {
      let { $type, $value, $description, $extensions } = token;
      const resolvedValue = resolveValue($value, originalObj);

      /**
       * Remove the dot at the end of the key name.
       * Example: "primary." -> "primary".
       * This is used when the token last key is empty.
       */
      const tokenName = path.replace(/\.$/, "");

      /**
       * Get the type of the referenced token.
       * @link https://tr.designtokens.org/format/#aliases-references
       */
      const referencedType = isReference($value)
        ? (get(originalObj, unwrapReference($value)) as Token)?.$type
        : undefined;

      /**
       * Inherit the type from the last group properties,
       * or use the type from the token.
       *
       * @link https://tr.designtokens.org/format/#type-1
       */
      const tokenType = $type ?? lastType ?? referencedType;

      if (tokenType === undefined) {
        throw new Error(
          `The token "${tokenName}" does not have a type. Please add a type.`,
        );
      }

      flatten.forEach((_, key) => {
        if (key.toLowerCase() === tokenName.toLowerCase()) {
          warnings.push(
            `⚠ The token "${tokenName}" has duplication in different cases. Please make sure the token names are unique. Taking the first one.`,
          );
        }
      });

      flatten.set(tokenName, {
        type: tokenType,
        value: $value,
        description: $description,
        extensions: $extensions,
        resolvedValue: resolvedValue,
        original: {
          path: tokenName,
          value: structuredClone($value),
          resolvedValue: structuredClone(resolvedValue),
        },
        parentProperties: lastGroupProperties,
      });
    },
  });

  return { detailed: flatten, warnings };
}

/**
 * Resolve the value of the token.
 * If the value is a reference, it will resolve the reference.
 *
 * @param value - The value to resolve.
 * @param originalObj - The original object (Token | TokenGroup).
 * @returns The resolved value.
 */
const resolveValue = (
  value: any,
  originalObj: Token | TokenGroup,
): Token["$value"] | undefined => {
  if (isValueComposite(value)) {
    if (Array.isArray(value)) {
      const result = value.map((subValue) =>
        resolveValue(subValue, originalObj),
      );

      if (result.some((v) => v !== undefined)) {
        return result as TokenValue;
      }

      return undefined;
    }

    return Object.entries(value).reduce((acc, [key, subValue]) => {
      // @ts-ignore
      acc[key] = resolveValue(subValue, originalObj);

      return acc;
    }, {} as TokenCompositeValue);
  }

  if (!isReference(value)) {
    return value;
  }

  const referencedToken = get(originalObj, unwrapReference(value)) as Token;

  if (!referencedToken) {
    return undefined;
  }

  if (isReference(referencedToken.$value)) {
    return resolveValue(referencedToken.$value, originalObj);
  }

  return referencedToken.$value;
};
