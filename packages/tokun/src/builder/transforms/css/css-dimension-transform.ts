import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { DimensionToken, ReferenceValue, Token } from "types/definitions.js";
import { isReference, stringifyDimensionValue } from "utils/helpers.js";
import { RESOLVED_EXTENSION } from "utils/to-flat.js";
import { Transform } from "utils/types.js";

export const cssDimensionTransform: Transform = {
  name: "css-dimension",
  type: "token",
  transitive: true,
  transformer: (unknownToken: Token) => {
    if (unknownToken.$type !== "dimension") {
      return unknownToken;
    }

    const token = unknownToken as DimensionToken;

    const transformed: {
      value?: string;
      resolvedValue?: string;
    } = {};

    if (!isReference(token.$value)) {
      transformed.value = stringifyDimensionValue(token.$value);
    } else {
      transformed.value = token.$value;
    }

    if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
      const resolvedValue = token.$extensions[RESOLVED_EXTENSION] as Exclude<
        DimensionToken["$value"],
        ReferenceValue
      >;

      transformed.resolvedValue = stringifyDimensionValue(resolvedValue);
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
