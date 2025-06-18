import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import { GradientToken, ReferenceValue, Token } from "types/definitions.js";
import { isReference } from "utils/token-utils.js";
import { Transform } from "utils/types.js";

export const cssGradientTransform: Transform = {
  name: "css-gradient",
  type: "token",
  transformer: (token: Token) => {
    const cssExtension: {
      value?: string;
      resolvedValue?: string;
    } = {};

    if (token.$type !== "gradient") {
      return token;
    }

    if (isReference(token.$value)) {
      cssExtension.value = token.$value;
    } else {
      cssExtension.value = `linear-gradient(90deg, ${token.$value.map((gradient) => (isReference(gradient) ? gradient : `${gradient.color} ${calcPosition(gradient.position)}`)).join(", ")})`;
    }

    if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
      const resolvedValue = token.$extensions[RESOLVED_EXTENSION] as Exclude<
        GradientToken["$value"],
        ReferenceValue
      >;
      cssExtension.resolvedValue = `linear-gradient(90deg, ${resolvedValue.map((gradient) => (isReference(gradient) ? gradient : `${gradient.color} ${calcPosition(gradient.position)}`)).join(", ")})`;
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

const calcPosition = (position: number | ReferenceValue): string => {
  if (isReference(position)) {
    return position;
  }

  return `${position * 100}%`;
};
