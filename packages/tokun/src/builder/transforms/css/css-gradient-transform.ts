import {
  CSS_EXTENSION,
  stringifyCssValue,
} from "builder/formats/css-format.js";
import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import type { Token } from "types/definitions.js";
import { getTokenValue, isTokenReference } from "utils/token-utils.js";
import type { Transform } from "utils/types.js";

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

    const tokenValue = getTokenValue(token);
    if (isTokenReference(tokenValue)) {
      cssExtension.value = tokenValue;
    } else if (Array.isArray(tokenValue)) {
      cssExtension.value = toCssGradient(tokenValue);
    }

    if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
      const resolvedValue = token.$extensions[RESOLVED_EXTENSION];
      if (Array.isArray(resolvedValue)) {
        cssExtension.resolvedValue = toCssGradient(resolvedValue);
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

function toCssGradient(value: unknown[]): string {
  return `linear-gradient(90deg, ${value
    .map((gradient) => {
      if (isTokenReference(gradient)) {
        return gradient;
      }

      if (typeof gradient !== "object" || gradient === null) {
        return String(gradient);
      }

      const gradientStop = gradient as {
        color: unknown;
        position: unknown;
      };

      return `${stringifyCssValue(gradientStop.color)} ${calcPosition(gradientStop.position)}`;
    })
    .join(", ")})`;
}

const calcPosition = (position: unknown): string => {
  if (isTokenReference(position)) {
    return position;
  }

  if (typeof position !== "number") {
    return String(position);
  }

  return `${position * 100}%`;
};
