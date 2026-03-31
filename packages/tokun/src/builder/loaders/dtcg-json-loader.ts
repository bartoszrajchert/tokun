import type { Token, TokenGroup, TokenValue } from "types/definitions.js";
import { logger } from "utils/logger.js";
import { assign, isEqual, isObject } from "utils/object-utils.js";
import type { FlattenTokens } from "utils/to-flat.js";
import { toFlat } from "utils/to-flat.js";
import {
  getByJsonPointer,
  getTokenValue,
  isReference,
  isToken,
  isTokenReference,
  normalizeRootTokenPath,
  unwrapReference,
} from "utils/token-utils.js";

import type { Loader } from "utils/types.js";

export const dtcgJsonLoader: Loader = {
  name: "dtcg-json",
  pattern: /(?:\.tokens)?(?:\.json)?$/,
  loadFn: ({ content }) => {
    resolveExtends(content);
    const { flatten } = toFlat(content);
    const resolvedFlatten = resolveTokens(flatten);

    fixGradientPosition(resolvedFlatten);

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
  reference: string,
  tokens: FlattenTokens,
  stack: string[],
  cache: Map<string, ResolvedValue>,
): unknown {
  if (isReference(reference)) {
    const rawRefPath = unwrapReference(reference);
    const refPath = normalizeRootTokenPath(rawRefPath);

    if (cache.has(refPath)) {
      return cache.get(refPath);
    }

    const guardedStack = withCycleGuard(stack, `token:${refPath}`);
    const referencedToken = tokens.get(refPath);

    if (!referencedToken) {
      throw new Error(`Reference ${rawRefPath} not found`);
    }

    const resolvedValue = resolveValue(
      getTokenValue(referencedToken),
      tokens,
      guardedStack,
      cache,
    );

    cache.set(refPath, resolvedValue);

    return resolvedValue;
  }

  throw new Error(`Invalid reference ${String(reference)}`);
}

function resolveValue(
  value: unknown,
  tokens: FlattenTokens,
  stack: string[],
  cache: Map<string, ResolvedValue>,
): ResolvedValue {
  if (isReference(value)) {
    return resolveReference(value, tokens, stack, cache);
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveValue(item, tokens, stack, cache));
  }

  if (isObject(value)) {
    if (isToken(value)) {
      return resolveValue(getTokenValue(value), tokens, stack, cache);
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        resolveValue(nestedValue, tokens, stack, cache),
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
export function resolveTokens(tokens: FlattenTokens): FlattenTokens {
  const resolvedByPath = new Map<string, ResolvedValue>();

  tokens.forEach((token, key) => {
    const tokenValue = getTokenValue(token);
    const resolved = resolvedByPath.has(key)
      ? resolvedByPath.get(key)
      : resolveValue(tokenValue, tokens, [`token:${key}`], resolvedByPath);

    resolvedByPath.set(key, resolved);
    setResolvedValue(token, tokenValue, resolved);
  });

  return tokens;
}
