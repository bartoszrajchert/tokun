import {
  CSS_EXTENSION,
  stringifyCssValue,
} from "builder/formats/css-format.js";
import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import type { Token } from "types/definitions.js";
import {
  getTokenValue,
  isTokenReference,
  stringifyUnitValue,
} from "utils/token-utils.js";
import type { Transform } from "utils/types.js";

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

    const tokenValue = getTokenValue(token);
    if (isTokenReference(tokenValue)) {
      cssExtension.value = tokenValue;
    } else {
      cssExtension.value = stringifyShadow(tokenValue);
    }

    if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
      cssExtension.resolvedValue = stringifyShadow(
        token.$extensions[RESOLVED_EXTENSION],
      );
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

function stringifyShadow(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((shadow) => stringifyShadowEntry(shadow)).join(", ");
  }

  return stringifyShadowEntry(value);
}

function stringifyShadowEntry(value: unknown): string {
  if (isTokenReference(value)) {
    return value;
  }

  if (typeof value !== "object" || value === null) {
    return String(value);
  }

  const shadow = value as {
    offsetX: unknown;
    offsetY: unknown;
    blur: unknown;
    spread: unknown;
    color: unknown;
  };

  return `${stringifyUnitValue(shadow.offsetX as never)} ${stringifyUnitValue(shadow.offsetY as never)} ${stringifyUnitValue(shadow.blur as never)} ${stringifyUnitValue(shadow.spread as never)} ${stringifyCssValue(shadow.color)}`;
}
