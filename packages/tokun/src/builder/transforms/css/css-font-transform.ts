import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import { Token, TokenReference } from "types/definitions.js";
import {
  getTokenValue,
  isReference,
  isTokenReference,
  stringifyUnitValue,
} from "utils/token-utils.js";
import { Transform } from "utils/types.js";

export const cssFontTransform: Transform = {
  name: "css-font",
  type: "token",
  transformer: (unknownToken: Token) => {
    const transformed: {
      value?: string;
      resolvedValue?: string;
    } = {};

    if (unknownToken.$type !== "typography") {
      return unknownToken;
    }

    const token = unknownToken;
    const tokenValue = getTokenValue(token);

    if (isTokenReference(tokenValue)) {
      transformed.value = stringifyReference(tokenValue);
    } else if (
      typeof tokenValue === "object" &&
      tokenValue !== null &&
      "fontWeight" in tokenValue &&
      "fontSize" in tokenValue &&
      "lineHeight" in tokenValue &&
      "fontFamily" in tokenValue
    ) {
      const typographyValue = tokenValue as {
        fontWeight: unknown;
        fontSize: unknown;
        lineHeight: unknown;
        fontFamily: unknown;
      };

      transformed.value = `${String(typographyValue.fontWeight)} ${stringifyUnitValue(typographyValue.fontSize as never)}/${String(typographyValue.lineHeight)} ${String(typographyValue.fontFamily)}`;
    }

    if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
      const resolvedValue = token.$extensions[RESOLVED_EXTENSION];
      if (
        typeof resolvedValue === "object" &&
        resolvedValue !== null &&
        !Array.isArray(resolvedValue) &&
        "fontWeight" in resolvedValue &&
        "fontSize" in resolvedValue &&
        "lineHeight" in resolvedValue &&
        "fontFamily" in resolvedValue
      ) {
        const typographyValue = resolvedValue as {
          fontWeight: unknown;
          fontSize: unknown;
          lineHeight: unknown;
          fontFamily: unknown;
        };

        transformed.resolvedValue = `${String(typographyValue.fontWeight)} ${stringifyUnitValue(typographyValue.fontSize as never)}/${String(typographyValue.lineHeight)} ${String(typographyValue.fontFamily)}`;
      }
    }

    if (Object.keys(transformed).length > 0) {
      if (!token.$extensions) {
        token.$extensions = {};
      }
      token.$extensions[CSS_EXTENSION] = transformed;
    }

    return token;
  },
};

function stringifyReference(reference: TokenReference): string {
  if (isReference(reference)) {
    return reference;
  }

  return reference.$ref;
}
