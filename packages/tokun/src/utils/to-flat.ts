import type { Token, TokenGroup, TokenType } from "types/definitions.js";
import { traverseTokens } from "./traverse-tokens.js";

export type FlattenTokens = Map<string, Token>;

export function toFlat(obj: Token | TokenGroup) {
  const flatten: FlattenTokens = new Map();

  traverseTokens(obj, {
    onToken(token, path, lastType) {
      if (lastType === undefined) {
        throw new Error("Last type is undefined");
      }

      const newToken: Token = {
        ...token,
        $type: lastType as TokenType,
      } as Token;

      flatten.set(path, newToken);
    },
  });

  const sortedFlatten = new Map(
    [...flatten.entries()].sort((a, b) => a[0].localeCompare(b[0])),
  );

  return { flatten: sortedFlatten };
}
