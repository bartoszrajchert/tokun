import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import { DimensionToken, ReferenceValue, Token } from "types/definitions.js";
import { isReference, stringifyDimensionValue } from "utils/token-utils.js";
import { Transform } from "utils/types.js";

export const cssDimensionTransform: Transform = {
  name: "css-dimension",
  type: "token",
  transformer: (token: Token) => {
    if (token.$type !== "dimension") {
      return token;
    }

    const cssExtension: {
      value?: string;
      resolvedValue?: string;
    } = {};

    if (!isReference(token.$value)) {
      cssExtension.value = stringifyDimensionValue(token.$value);
    } else {
      cssExtension.value = token.$value;
    }

    if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
      const resolvedValue = token.$extensions[RESOLVED_EXTENSION] as Exclude<
        DimensionToken["$value"],
        ReferenceValue
      >;

      cssExtension.resolvedValue = stringifyDimensionValue(resolvedValue);
    }

    if (Object.keys(cssExtension).length > 0) {
      if (!token.$extensions) {
        token.$extensions = {};
      }
      token.$extensions[CSS_EXTENSION] = cssExtension;
    }

    return token;
  },
};
