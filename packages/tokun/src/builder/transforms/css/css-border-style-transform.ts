import { CSS_EXTENSION } from "builder/formats/css-format.js";
import {
  BorderToken,
  ReferenceValue,
  StrokeStyleToken,
  Token,
} from "types/definitions.js";

import { isReference, stringifyDimensionValue } from "utils/helpers.js";
import { RESOLVED_EXTENSION } from "utils/to-flat.js";
import { Transform } from "utils/types.js";

export const cssBorderStyleTransform: Transform = {
  name: "css-border",
  type: "token",
  transitive: true,
  transformer: (unknownToken: Token) => {
    if (unknownToken.$type === "border") {
      return cssBorderTransform(unknownToken);
    }

    if (unknownToken.$type === "strokeStyle") {
      return cssStrokeStyleTransform(unknownToken);
    }

    return unknownToken;
  },
};

const cssBorderTransform = (token: BorderToken) => {
  const transformed: {
    value?: string;
    resolvedValue?: string;
  } = {};

  if (isReference(token.$value)) {
    transformed.value = token.$value;
  } else {
    transformed.value = `${stringifyDimensionValue(token.$value.width)} ${token.$value.style} ${token.$value.color}`;
  }

  if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
    const resolvedValue = token.$extensions[RESOLVED_EXTENSION] as Exclude<
      BorderToken["$value"],
      ReferenceValue
    >;

    transformed.resolvedValue = `${stringifyDimensionValue(resolvedValue.width)} ${resolvedValue.style} ${resolvedValue.color}`;
  }

  if (Object.keys(transformed).length > 0) {
    if (!token.$extensions) {
      token.$extensions = {};
    }
    token.$extensions[CSS_EXTENSION] = transformed;
  }

  return token;
};

/**
 * Should fallback to dashed if strokeStyle is a complex object
 * according to the design token specification.
 * @link https://tr.designtokens.org/format/#fallbacks
 */
const cssStrokeStyleTransform = (token: StrokeStyleToken) => {
  const transformed: {
    value?: string;
    resolvedValue?: string;
  } = {};

  transformed.value =
    isReference(token.$value) || typeof token.$value === "string"
      ? token.$value
      : "dashed";

  if (token.$extensions && token.$extensions[RESOLVED_EXTENSION]) {
    const resolvedValue = token.$extensions[RESOLVED_EXTENSION] as Exclude<
      StrokeStyleToken["$value"],
      ReferenceValue
    >;

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
