import { yellow } from "kleur/colors";
import { Token, TokenValue } from "types/definitions.js";
import { isObject } from "utils/object-utils.js";
import { FlattenTokens, toFlat } from "utils/to-flat.js";
import {
  isReference,
  isValueComposite,
  unwrapReference,
} from "utils/token-utils.js";

import { Loader } from "utils/types.js";

export const dtcgJsonLoader: Loader = {
  name: "dtcg-json",
  pattern: /(?:\.tokens)?(?:\.json)?$/,
  loadFn: ({ content }) => {
    const { flatten } = toFlat(content);
    const resolvedFlatten = resolveTokens(flatten);

    fixGradientPosition(resolvedFlatten);
    // TODO: Dash array fix -> https://tr.designtokens.org/format/#object-value
    // TODO: Fallbacks https://tr.designtokens.org/format/#fallbacks

    return resolvedFlatten;
  },
};

/**
 * Gradient fix according to the design-tokens spec
 *
 * @link https://tr.designtokens.org/format/#gradient
 */
const fixGradientPosition = (flatten: FlattenTokens) => {
  const validateGradientPosition = (gradient: any, tokenName: string) => {
    if (isReference(gradient) || isReference(gradient.position)) {
      return gradient;
    }

    const { position, color } = gradient;
    if (position > 1 || position < 0) {
      const newPosition = position > 1 ? 1 : 0;
      console.warn(
        yellow(
          `⚠ The position of the gradient in "${tokenName}" for "${color}" is set to ${position}. It should not be ${position > 1 ? "more then" : "less then"} ${position > 1 ? "1" : "0"}. Setting it to ${newPosition}.`,
        ),
      );
      gradient.position = newPosition;
    }

    return gradient;
  };

  flatten.forEach((token, name) => {
    if (token.$type !== "gradient") {
      return;
    }

    if (isReference(token.$value)) {
      return;
    }

    token.$value = token.$value.map((gradient) =>
      validateGradientPosition(gradient, name),
    );

    if (token.$extensions?.[RESOLVED_EXTENSION]) {
      token.$extensions[RESOLVED_EXTENSION] = token.$extensions[
        RESOLVED_EXTENSION
      ].map((gradient: any) => validateGradientPosition(gradient, name));
    }
  });
};

export const RESOLVED_EXTENSION = "com.tokun.resolvedValue";

type ResolvedValue = TokenValue | TokenValue[] | Record<string, TokenValue>;

/**
 * Resolves a reference to its actual token value
 */
function resolveReference(
  value: TokenValue,
  tokens: FlattenTokens,
): Token | null {
  if (!isReference(value)) {
    return null;
  }

  const ref = tokens.get(unwrapReference(value));
  if (!ref) {
    throw new Error(`Reference ${unwrapReference(value)} not found`);
  }

  // If the value is a reference, resolve it first
  if (isReference(ref.$value)) {
    const nestedRef = resolveReference(ref.$value, tokens);
    if (nestedRef) {
      if (nestedRef.$extensions?.[RESOLVED_EXTENSION]) {
        if (!ref.$extensions) {
          ref.$extensions = {};
        }
        ref.$extensions[RESOLVED_EXTENSION] =
          nestedRef.$extensions[RESOLVED_EXTENSION];
      }
    }
  }

  // If the value is composite, resolve it
  if (isValueComposite(ref.$value)) {
    let resolvedValue: ResolvedValue;
    if (Array.isArray(ref.$value)) {
      resolvedValue = resolveArrayValues(
        ref.$value as unknown as TokenValue[],
        tokens,
      );
    } else if (typeof ref.$value === "object" && ref.$value !== null) {
      resolvedValue = resolveObjectValues(
        ref.$value as Record<string, TokenValue>,
        tokens,
      );
    } else {
      resolvedValue = ref.$value;
    }
    setResolvedValue(ref, resolvedValue);
  } else {
    // For simple values, set the resolved value directly
    setResolvedValue(ref, ref.$value);
  }

  return ref;
}

/**
 * Sets the resolved value in the token's extensions
 */
function setResolvedValue(token: Token, resolvedValue: ResolvedValue): void {
  // Only add the extension if the resolved value is different from the original value
  if (JSON.stringify(token.$value) === JSON.stringify(resolvedValue)) {
    // Do not add the extension if nothing changed
    return;
  }
  if (!token.$extensions) {
    token.$extensions = {};
  }
  token.$extensions[RESOLVED_EXTENSION] = resolvedValue;
}

/**
 * Resolves references in an array of values
 */
function resolveArrayValues(
  values: TokenValue[],
  tokens: FlattenTokens,
): TokenValue[] {
  return values
    .map((item) => {
      if (isReference(item)) {
        const ref = resolveReference(item, tokens);
        return ref ? ref.$value : item;
      }

      if (isValueComposite(item)) {
        if (Array.isArray(item)) {
          return resolveArrayValues(item as unknown as TokenValue[], tokens);
        }
        if (typeof item === "object" && item !== null) {
          return resolveObjectValues(
            item as Record<string, TokenValue>,
            tokens,
          );
        }
      }

      return item;
    })
    .filter((item): item is TokenValue => item !== null);
}

/**
 * Resolves references in an object's values
 */
function resolveObjectValues(
  obj: Record<string, TokenValue>,
  tokens: FlattenTokens,
): Record<string, TokenValue> {
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => {
      if (isReference(val)) {
        const ref = resolveReference(val, tokens);
        return [key, ref ? ref.$value : val];
      }
      if (isValueComposite(val)) {
        if (Array.isArray(val)) {
          return [
            key,
            resolveArrayValues(val as unknown as TokenValue[], tokens),
          ];
        }
        if (typeof val === "object" && val !== null) {
          return [
            key,
            resolveObjectValues(val as Record<string, TokenValue>, tokens),
          ];
        }
      }
      return [key, val];
    }),
  );
}

/**
 * Resolves all token references in the given token collection
 */
export function resolveTokens(tokens: FlattenTokens): FlattenTokens {
  tokens.forEach((token) => {
    if (isReference(token.$value)) {
      const ref = resolveReference(token.$value, tokens);
      if (ref) {
        if (ref.$extensions) {
          if (!token.$extensions) {
            token.$extensions = {};
          }
          token.$extensions[RESOLVED_EXTENSION] =
            ref.$extensions[RESOLVED_EXTENSION];
        } else {
          setResolvedValue(token, ref.$value);
        }
      }
    } else if (isValueComposite(token.$value)) {
      if (Array.isArray(token.$value)) {
        const resolvedArray = resolveArrayValues(
          token.$value as unknown as TokenValue[],
          tokens,
        );
        if (resolvedArray.length > 0) {
          setResolvedValue(token, resolvedArray);
        }
      } else if (isObject(token.$value)) {
        const resolvedObject = resolveObjectValues(
          token.$value as Record<string, TokenValue>,
          tokens,
        );
        setResolvedValue(token, resolvedObject);
      }
    }
  });

  return tokens;
}
