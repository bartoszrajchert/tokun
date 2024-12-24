import { Token, TokenGroup } from "types/definitions.js";
import { isReference, unwrapReference } from "./helpers.js";
import { traverseTokens } from "./traverse-tokens.js";

export type FlattenTokens = Map<string, Token>;

export function toFlat(obj: Token | TokenGroup) {
  const flatten: FlattenTokens = new Map();

  traverseTokens(obj, {
    onToken(token, path, lastType) {
      if (lastType === undefined) {
        throw new Error("Last type is undefined");
      }

      // TODO: Fix this
      // @ts-ignore
      const newToken: Token = { ...token, $type: lastType };

      flatten.set(path, newToken);
    },
  });

  return { flatten };
}

export const RESOLVED_EXTENSION = "com.tokun.resolvedValue";
export function resolveTokens(obj: FlattenTokens) {
  const loopResolveValue = (token: Token): Token => {
    if (isReference(token.$value)) {
      const ref = obj.get(unwrapReference(token.$value));
      if (ref && isReference(ref.$value)) {
        return loopResolveValue(ref);
      }

      if (ref) {
        return ref;
      }
    }

    return token;
  };

  obj.forEach((token) => {
    if (isReference(token.$value)) {
      const ref = loopResolveValue(token);
      if (ref) {
        if (!token.$extensions) {
          token.$extensions = {};
        }

        token.$extensions = {
          ...token.$extensions,
          [RESOLVED_EXTENSION]: ref.$value,
        };
      }
    }
  });

  return obj;
}
