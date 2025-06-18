import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import { ReferenceValue, Token, TypographyToken } from "types/definitions.js";
import { isReference, stringifyDimensionValue } from "utils/token-utils.js";
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

    const token = unknownToken as TypographyToken;

    if (isReference(token.$value)) {
      transformed.value = token.$value;
    } else {
      transformed.value = `${token.$value.fontWeight} ${stringifyDimensionValue(token.$value.fontSize)}/${token.$value.lineHeight} ${token.$value.fontFamily}`;
    }

    if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
      const resolvedValue = token.$extensions[RESOLVED_EXTENSION] as Exclude<
        TypographyToken["$value"],
        ReferenceValue
      >;
      transformed.resolvedValue = `${resolvedValue.fontWeight} ${stringifyDimensionValue(resolvedValue.fontSize)}/${resolvedValue.lineHeight} ${resolvedValue.fontFamily}`;
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
