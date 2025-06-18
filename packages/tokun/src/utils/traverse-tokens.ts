import { Token, TokenGroup, TokenGroupProperties } from "types/definitions.js";
import { isToken } from "./token-utils.js";

export function traverseTokens(
  value: unknown,
  {
    onToken,
    onGroup,
  }: {
    onToken?: (
      token: Token,
      path: string,
      lastType?: string,
      lastGroupProperties?: TokenGroupProperties,
    ) => void;
    onGroup?: (group: TokenGroup, path: string) => void;
  },
) {
  if (value instanceof Map) {
    value = Object.fromEntries(value);
  }

  const stack: {
    value: Token | TokenGroup;
    key: string;
    lastType?: string;
    lastGroupProperties?: TokenGroupProperties;
  }[] = [{ value: value as Token | TokenGroup, key: "" }];

  while (stack.length > 0) {
    const { value, key, lastType, lastGroupProperties } = stack.shift()!;

    if (isToken(value) && onToken) {
      onToken(value, key, lastType, lastGroupProperties);
      continue;
    }

    if (typeof value !== "object" || value === null) {
      throw new Error("Should not reach here");
    }

    if (onGroup) {
      onGroup(value as TokenGroup, key);
    }

    const entries = Object.entries(value);
    for (const [nextKey, nestedValue] of entries) {
      if (nextKey.startsWith("$")) continue;

      const isNextKeyEmpty = nextKey === "";
      const finalKey = isNextKeyEmpty
        ? key
        : key
          ? `${key}.${nextKey}`
          : nextKey;
      if (typeof nestedValue === "object") {
        const nextValue = nestedValue as Token | TokenGroup;
        const newLastGroupProperties =
          value.$description || value.$extensions || value.$type
            ? {
                $description: value.$description,
                $extensions: value.$extensions,
                $type: value.$type,
              }
            : lastGroupProperties;

        stack.push({
          value: nextValue,
          key: finalKey,
          lastType: nextValue?.$type || lastType,
          lastGroupProperties: newLastGroupProperties,
        });
      } else {
        throw new Error(
          `Something is wrong with the structure of the tokens. Check the token with key: ${finalKey}`,
        );
      }
    }
  }
}
