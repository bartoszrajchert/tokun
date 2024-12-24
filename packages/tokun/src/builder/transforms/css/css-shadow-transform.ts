import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { ReferenceValue, ShadowToken, Token } from "types/definitions.js";
import { isReference, stringifyDimensionValue } from "utils/helpers.js";
import { RESOLVED_EXTENSION } from "utils/to-flat.js";
import { Transform } from "utils/types.js";

export const cssShadowTransform: Transform = {
  name: "css-shadow",
  type: "token",
  transitive: true,
  transformer: (unknownToken: Token) => {
    const transformed: {
      value?: string;
      resolvedValue?: string;
    } = {};

    if (unknownToken.$type !== "shadow") {
      return unknownToken;
    }

    const token = unknownToken as ShadowToken;

    if (isReference(token.$value)) {
      transformed.value = token.$value;
    } else {
      if (Array.isArray(token.$value)) {
        transformed.value = token.$value
          .map((shadow) =>
            isReference(shadow)
              ? shadow
              : `${stringifyDimensionValue(shadow.offsetX)} ${stringifyDimensionValue(shadow.offsetY)} ${stringifyDimensionValue(shadow.blur)} ${stringifyDimensionValue(shadow.spread)} ${shadow.color}${shadow.inset ? " inset" : ""}`,
          )
          .join(", ");
      } else {
        transformed.value = `${stringifyDimensionValue(token.$value.offsetX)} ${stringifyDimensionValue(token.$value.offsetY)} ${stringifyDimensionValue(token.$value.blur)} ${stringifyDimensionValue(token.$value.spread)} ${token.$value.color}${token.$value.inset ? " inset" : ""}`;
      }
    }

    if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
      const resolvedValue = token.$extensions[RESOLVED_EXTENSION] as Exclude<
        ShadowToken["$value"],
        ReferenceValue
      >;
      if (Array.isArray(resolvedValue)) {
        transformed.resolvedValue = resolvedValue
          .map((shadow) =>
            isReference(shadow)
              ? shadow
              : `${stringifyDimensionValue(shadow.offsetX)} ${stringifyDimensionValue(shadow.offsetY)} ${stringifyDimensionValue(shadow.blur)} ${stringifyDimensionValue(shadow.spread)} ${shadow.color}${shadow.inset ? " inset" : ""}`,
          )
          .join(", ");
      } else {
        transformed.resolvedValue = `${stringifyDimensionValue(resolvedValue.offsetX)} ${stringifyDimensionValue(resolvedValue.offsetY)} ${stringifyDimensionValue(resolvedValue.blur)} ${stringifyDimensionValue(resolvedValue.spread)} ${resolvedValue.color}${resolvedValue.inset ? " inset" : ""}`;
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
