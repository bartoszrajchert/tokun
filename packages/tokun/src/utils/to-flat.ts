import { Token, TokenGroup } from "types/definitions.js";
import { isReference, unwrapReference } from "./token-utils.js";
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
