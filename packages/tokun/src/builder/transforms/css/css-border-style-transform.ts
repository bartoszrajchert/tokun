import {
  CSS_EXTENSION,
  stringifyCssValue,
} from "builder/formats/css-format.js";
import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import { Token, TokenReference } from "types/definitions.js";

import {
  getTokenValue,
  isReference,
  isTokenReference,
  stringifyUnitValue,
} from "utils/token-utils.js";
import { Transform } from "utils/types.js";

export const cssBorderStyleTransform: Transform = {
  name: "css-border",
  type: "token",
  transformer: (token: Token) => {
    if (token.$type === "border") {
      return cssBorderTransform(token);
    }

    if (token.$type === "strokeStyle") {
      return cssStrokeStyleTransform(token);
    }

    return token;
  },
};

const cssBorderTransform = (token: Token) => {
  const cssExtension: {
    value?: string;
    resolvedValue?: string;
  } = {};

  const tokenValue = getTokenValue(token);

  if (isTokenReference(tokenValue)) {
    cssExtension.value = stringifyReference(tokenValue);
  } else if (
    typeof tokenValue === "object" &&
    tokenValue !== null &&
    "width" in tokenValue &&
    "style" in tokenValue &&
    "color" in tokenValue
  ) {
    const borderValue = tokenValue as {
      width: unknown;
      style: unknown;
      color: unknown;
    };

    cssExtension.value = `${stringifyUnitValue(borderValue.width as never)} ${String(borderValue.style)} ${stringifyCssValue(borderValue.color)}`;
  }

  if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
    const resolvedValue = token.$extensions[RESOLVED_EXTENSION];
    if (
      typeof resolvedValue === "object" &&
      resolvedValue !== null &&
      !Array.isArray(resolvedValue) &&
      "width" in resolvedValue &&
      "style" in resolvedValue &&
      "color" in resolvedValue
    ) {
      const borderValue = resolvedValue as {
        width: unknown;
        style: unknown;
        color: unknown;
      };

      cssExtension.resolvedValue = `${stringifyUnitValue(borderValue.width as never)} ${String(borderValue.style)} ${stringifyCssValue(borderValue.color)}`;
    }
  }

  if (Object.keys(cssExtension).length > 0) {
    if (!token.$extensions) {
      token.$extensions = {};
    }
    token.$extensions[CSS_EXTENSION] = cssExtension;
  }

  return token;
};

/**
 * Should fallback to dashed if strokeStyle is a complex object
 * according to the design token specification.
 * @link https://tr.designtokens.org/format/#fallbacks
 */
const cssStrokeStyleTransform = (token: Token) => {
  const transformed: {
    value?: string;
    resolvedValue?: string;
  } = {};

  const tokenValue = getTokenValue(token);

  transformed.value =
    isTokenReference(tokenValue) || typeof tokenValue === "string"
      ? isTokenReference(tokenValue)
        ? stringifyReference(tokenValue)
        : tokenValue
      : "dashed";

  if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
    const resolvedValue = token.$extensions[RESOLVED_EXTENSION];

    transformed.resolvedValue =
      typeof resolvedValue === "string" ? resolvedValue : "dashed";
  }

  if (Object.keys(transformed).length > 0) {
    if (!token.$extensions) {
      token.$extensions = {};
    }
    token.$extensions[CSS_EXTENSION] = transformed;
  }

  return token;
};

function stringifyReference(reference: TokenReference): string {
  if (isReference(reference)) {
    return reference;
  }

  return reference.$ref;
}
