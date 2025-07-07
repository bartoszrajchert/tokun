import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import { ReferenceValue, ShadowToken, Token } from "types/definitions.js";
import { isReference, stringifyUnitValue } from "utils/token-utils.js";
import { Transform } from "utils/types.js";

export const cssShadowTransform: Transform = {
  name: "css-shadow",
  type: "token",
  transformer: (token: Token) => {
    const cssExtension: {
      value?: string;
      resolvedValue?: string;
    } = {};

    if (token.$type !== "shadow") {
      return token;
    }

    if (isReference(token.$value)) {
      cssExtension.value = token.$value;
    } else {
      if (Array.isArray(token.$value)) {
        cssExtension.value = token.$value
          .map((shadow) =>
            isReference(shadow)
              ? shadow
              : `${stringifyUnitValue(shadow.offsetX)} ${stringifyUnitValue(shadow.offsetY)} ${stringifyUnitValue(shadow.blur)} ${stringifyUnitValue(shadow.spread)} ${shadow.color}${shadow.inset ? " inset" : ""}`,
          )
          .join(", ");
      } else {
        cssExtension.value = `${stringifyUnitValue(token.$value.offsetX)} ${stringifyUnitValue(token.$value.offsetY)} ${stringifyUnitValue(token.$value.blur)} ${stringifyUnitValue(token.$value.spread)} ${token.$value.color}${token.$value.inset ? " inset" : ""}`;
      }
    }

    if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
      const resolvedValue = token.$extensions[RESOLVED_EXTENSION] as Exclude<
        ShadowToken["$value"],
        ReferenceValue
      >;
      if (Array.isArray(resolvedValue)) {
        cssExtension.resolvedValue = resolvedValue
          .map((shadow) =>
            isReference(shadow)
              ? shadow
              : `${stringifyUnitValue(shadow.offsetX)} ${stringifyUnitValue(shadow.offsetY)} ${stringifyUnitValue(shadow.blur)} ${stringifyUnitValue(shadow.spread)} ${shadow.color}${shadow.inset ? " inset" : ""}`,
          )
          .join(", ");
      } else {
        cssExtension.resolvedValue = `${stringifyUnitValue(resolvedValue.offsetX)} ${stringifyUnitValue(resolvedValue.offsetY)} ${stringifyUnitValue(resolvedValue.blur)} ${stringifyUnitValue(resolvedValue.spread)} ${resolvedValue.color}${resolvedValue.inset ? " inset" : ""}`;
      }
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
