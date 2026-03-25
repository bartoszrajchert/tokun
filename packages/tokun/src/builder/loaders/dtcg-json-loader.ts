import {
  DimensionToken,
  JsonPointerReferenceObject,
  Token,
  TokenGroup,
  TokenValue,
} from "types/definitions.js";
import { logger } from "utils/logger.js";
import { assign, isEqual, isObject } from "utils/object-utils.js";
import { FlattenTokens, toFlat } from "utils/to-flat.js";
import {
  getByJsonPointer,
  getTokenValue,
  isJsonPointerReferenceObject,
  isReference,
  isToken,
  isTokenReference,
  normalizeRootTokenPath,
  unwrapReference,
} from "utils/token-utils.js";

import { Loader } from "utils/types.js";

export const dtcgJsonLoader: Loader = {
  name: "dtcg-json",
  pattern: /(?:\.tokens)?(?:\.json)?$/,
  loadFn: ({ content }) => {
    resolveExtends(content);
    const { flatten } = toFlat(content);
    const resolvedFlatten = resolveTokens(flatten, content);

    fixGradientPosition(resolvedFlatten);
    fixStrokeStyleDashArray(resolvedFlatten);

    return resolvedFlatten;
  },
};

/**
 * Resolve `$extends` group inheritance.
 * Deep-merges the referenced group's tokens into the extending group.
 * Detects circular inheritance.
 */
function resolveExtends(
  content: TokenGroup,
  root?: TokenGroup,
  resolving: Set<string> = new Set(),
  path = "",
): void {
  const rootContent = root ?? content;
  const currentPath = path || "#";

  if (resolving.has(currentPath)) {
    throw new Error(`Circular $extends detected at "${currentPath}"`);
  }
  resolving.add(currentPath);

  if (content.$extends) {
    const { group: referencedGroup, path: referencedPath } =
      resolveGroupReference(rootContent, content.$extends);

    resolveExtends(referencedGroup, rootContent, resolving, referencedPath);

    const merged = assign(
      structuredClone(referencedGroup),
      structuredClone(content),
    );

    delete merged.$extends;

    Object.keys(content).forEach((key) => {
      delete (content as Record<string, unknown>)[key];
    });
    Object.assign(content, merged);
  }

  for (const [key, value] of Object.entries(content)) {
    if (key.startsWith("$")) {
      continue;
    }

    if (!isTokenGroup(value)) {
      continue;
    }

    const groupPath = path ? `${path}.${key}` : key;
    resolveExtends(value, rootContent, resolving, groupPath);
  }

  resolving.delete(currentPath);
}

function isTokenGroup(value: unknown): value is TokenGroup {
  return isObject(value) && !isToken(value);
}

function getNestedGroup(
  root: TokenGroup,
  path: string,
): TokenGroup | undefined {
  if (path === "") {
    return root;
  }

  const parts = path.split(".").filter((part) => part !== "");
  let current: unknown = root;

  for (const part of parts) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  if (!isTokenGroup(current)) {
    return undefined;
  }

  return current;
}

function resolveGroupReference(
  root: TokenGroup,
  reference: string,
): { group: TokenGroup; path: string } {
  if (isReference(reference)) {
    const path = unwrapReference(reference);
    const group = getNestedGroup(root, path);

    if (!group) {
      throw new Error(`$extends reference "${reference}" not found`);
    }

    return { group, path };
  }

  const target = getByJsonPointer(root, reference);
  if (!isTokenGroup(target)) {
    throw new Error(`$extends reference "${reference}" must point to a group`);
  }

  const normalizedPath = reference
    .slice(2)
    .split("/")
    .filter((segment) => segment !== "")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"))
    .join(".");

  return { group: target, path: normalizedPath };
}

/**
 * Gradient fix according to the design-tokens spec
 *
 * @link https://tr.designtokens.org/format/#gradient
 */
const fixGradientPosition = (flatten: FlattenTokens) => {
  const validateGradientPosition = (
    gradient: Record<string, unknown>,
    tokenName: string,
  ) => {
    if (isTokenReference(gradient)) {
      return gradient;
    }

    if (isTokenReference(gradient.position)) {
      return gradient;
    }

    const position = gradient.position as number;
    const color = gradient.color;
    if (typeof position !== "number") {
      return gradient;
    }

    if (position > 1 || position < 0) {
      const newPosition = position > 1 ? 1 : 0;
      logger.warn(
        `⚠ The position of the gradient in "${tokenName}" for "${String(color)}" is set to ${position}. It should not be ${position > 1 ? "more than" : "less than"} ${position > 1 ? "1" : "0"}. Setting it to ${newPosition}.`,
      );
      gradient.position = newPosition;
    }

    return gradient;
  };

  flatten.forEach((token, name) => {
    if (token.$type !== "gradient") {
      return;
    }

    const tokenValue = getTokenValue(token);

    if (!isTokenReference(tokenValue) && Array.isArray(tokenValue)) {
      const normalized = tokenValue.map((gradient) =>
        validateGradientPosition(gradient as Record<string, unknown>, name),
      );

      if ("$value" in token) {
        (token as { $value: Record<string, unknown>[] }).$value = normalized;
      }
    }

    if (token.$extensions?.[RESOLVED_EXTENSION]) {
      const resolved = token.$extensions[RESOLVED_EXTENSION];

      if (Array.isArray(resolved)) {
        token.$extensions[RESOLVED_EXTENSION] = resolved.map((gradient) =>
          validateGradientPosition(gradient as Record<string, unknown>, name),
        );
      }
    }
  });
};

/**
 * Resolve dashArray dimension values in StrokeStyle tokens with object values.
 *
 * @link https://tr.designtokens.org/format/#object-value
 */
const fixStrokeStyleDashArray = (flatten: FlattenTokens) => {
  flatten.forEach((token, name) => {
    if (token.$type !== "strokeStyle") return;

    const tokenValue = getTokenValue(token);
    if (isTokenReference(tokenValue)) return;
    if (typeof tokenValue === "string") return;
    if (!isObject(tokenValue) || !("dashArray" in tokenValue)) return;
    if (!Array.isArray(tokenValue.dashArray)) return;

    const strokeValue = tokenValue as {
      dashArray: DimensionToken["$value"][];
    };

    const normalizedDashArray = strokeValue.dashArray.map((dim) => {
      if (isReference(dim)) {
        const rawRefPath = unwrapReference(dim);
        const refPath = normalizeRootTokenPath(rawRefPath);
        const ref = flatten.get(refPath);

        if (ref) {
          const refValue = getTokenValue(ref);
          if (!isTokenReference(refValue)) {
            return refValue as typeof dim;
          }
        }

        throw new Error(`Reference ${rawRefPath} not found in ${name}`);
      }

      return dim;
    });

    strokeValue.dashArray = normalizedDashArray;

    if ("$value" in token) {
      (token as { $value: typeof strokeValue }).$value = strokeValue;
    }

    if (token.$extensions?.[RESOLVED_EXTENSION]) {
      const resolved = token.$extensions[RESOLVED_EXTENSION];

      if (
        isObject(resolved) &&
        "dashArray" in resolved &&
        Array.isArray(resolved.dashArray)
      ) {
        resolved.dashArray = resolved.dashArray.map(
          (dim: DimensionToken["$value"]): DimensionToken["$value"] => {
            if (isReference(dim)) {
              const rawRefPath = unwrapReference(dim);
              const refPath = normalizeRootTokenPath(rawRefPath);
              const ref = flatten.get(refPath);

              if (ref) {
                const refValue = getTokenValue(ref);
                if (!isTokenReference(refValue)) {
                  return refValue as DimensionToken["$value"];
                }
              }

              throw new Error(`Reference ${rawRefPath} not found in ${name}`);
            }

            return dim;
          },
        );
      }
    }
  });
};

export const RESOLVED_EXTENSION = "com.tokun.resolvedValue";

type ResolvedValue = unknown;

function withCycleGuard(stack: string[], id: string): string[] {
  if (stack.includes(id)) {
    throw new Error(
      `Circular reference detected: ${[...stack, id].join(" -> ")}`,
    );
  }

  return [...stack, id];
}

function resolveReference(
  reference: string | JsonPointerReferenceObject,
  tokens: FlattenTokens,
  root: TokenGroup,
  stack: string[],
): unknown {
  if (isReference(reference)) {
    const rawRefPath = unwrapReference(reference);
    const refPath = normalizeRootTokenPath(rawRefPath);
    const guardedStack = withCycleGuard(stack, `token:${refPath}`);
    const referencedToken = tokens.get(refPath);

    if (!referencedToken) {
      throw new Error(`Reference ${rawRefPath} not found`);
    }

    return resolveValue(
      getTokenValue(referencedToken),
      tokens,
      root,
      guardedStack,
    );
  }

  if (!isJsonPointerReferenceObject(reference)) {
    throw new Error(`Invalid reference ${String(reference)}`);
  }

  const pointer = reference.$ref;
  const guardedStack = withCycleGuard(stack, `pointer:${pointer}`);
  const referencedValue = getByJsonPointer(root, pointer);

  if (referencedValue === undefined) {
    throw new Error(`Reference ${pointer} not found`);
  }

  if (isObject(referencedValue) && isToken(referencedValue)) {
    return resolveValue(
      getTokenValue(referencedValue),
      tokens,
      root,
      guardedStack,
    );
  }

  return resolveValue(referencedValue, tokens, root, guardedStack);
}

function resolveValue(
  value: unknown,
  tokens: FlattenTokens,
  root: TokenGroup,
  stack: string[],
): ResolvedValue {
  if (isReference(value) || isJsonPointerReferenceObject(value)) {
    return resolveReference(value, tokens, root, stack);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, tokens, root, stack));
  }

  if (isObject(value)) {
    if (isToken(value)) {
      return resolveValue(getTokenValue(value), tokens, root, stack);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        resolveValue(nestedValue, tokens, root, stack),
      ]),
    );
  }

  return value;
}

/**
 * Sets the resolved value in the token's extensions
 */
function setResolvedValue(
  token: Token,
  sourceValue: unknown,
  resolvedValue: ResolvedValue,
): void {
  if (isEqual(sourceValue, resolvedValue)) {
    return;
  }

  if (!token.$extensions) {
    token.$extensions = {};
  }

  token.$extensions[RESOLVED_EXTENSION] = resolvedValue;
}

/**
 * Resolves all token references in the given token collection
 */
export function resolveTokens(
  tokens: FlattenTokens,
  root: TokenGroup,
): FlattenTokens {
  tokens.forEach((token, key) => {
    const tokenValue = getTokenValue(token);
    const resolved = resolveValue(tokenValue, tokens, root, [`token:${key}`]);
    setResolvedValue(token, tokenValue, resolved);
  });

  return tokens;
}
