import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { GradientToken, ReferenceValue, Token } from "types/definitions.js";
import { isReference } from "utils/helpers.js";
import { RESOLVED_EXTENSION } from "utils/to-flat.js";
import { Transform } from "utils/types.js";

export const cssGradientTransform: Transform = {
  name: "css-gradient",
  type: "token",
  transitive: true,
  transformer: (unknownToken: Token) => {
    const transformed: {
      value?: string;
      resolvedValue?: string;
    } = {};

    if (unknownToken.$type !== "gradient") {
      return unknownToken;
    }

    const token = unknownToken as GradientToken;

    if (isReference(token.$value)) {
      transformed.value = token.$value;
    } else {
      transformed.value = `linear-gradient(90deg, ${token.$value.map((gradient) => (isReference(gradient) ? gradient : `${gradient.color} ${calcPosition(gradient.position)}`)).join(", ")})`;
    }

    if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
      const resolvedValue = token.$extensions[RESOLVED_EXTENSION] as Exclude<
        GradientToken["$value"],
        ReferenceValue
      >;
      transformed.resolvedValue = `linear-gradient(90deg, ${resolvedValue.map((gradient) => (isReference(gradient) ? gradient : `${gradient.color} ${calcPosition(gradient.position)}`)).join(", ")})`;
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

const calcPosition = (position: number | ReferenceValue): string => {
  if (isReference(position)) {
    return position;
  }

  return `${position * 100}%`;
};
