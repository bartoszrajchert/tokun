import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import {
  ColorToken,
  StructuredColor,
  Token,
  TypographyToken,
} from "types/definitions.js";
import {
  getTokenValue,
  isReference,
  isTokenReference,
  stringifyUnitValue,
} from "utils/token-utils.js";
import { Format, FormatConfig } from "utils/types.js";

type CSSRoot = Record<
  string,
  {
    value: string;
    description?: string;
    deprecated?: boolean | string;
  }
>;

export const CSS_EXTENSION = "com.tokun.css";

/**
 * CSS formatter.
 * Custom extension `com.tokun.css` with `value` and `resolvedValue` properties
 * is used to take transformed values (recommended for better CSS output).
 * Otherwise, the `value` and `resolvedValue` will be used.
 *
 * Reference:
 *  - https://www.w3.org/TR/CSS22/syndata.html#value-def-identifier
 *  - https://drafts.csswg.org/css-variables/#defining-variables
 */
export const cssFormat: Format = {
  name: "css",
  formatter: ({ tokens, config, fileHeader }) => {
    config.outputReferences = config.outputReferences ?? false;
    const prefix = config.prefix as string | undefined;
    const selector = (config.selector as string) ?? ":root";
    const cssRoot: CSSRoot = {};

    tokens.forEach((token, path) => {
      const variableName = createVariableName(path, prefix);
      const resolvedValue = resolveTokenValue(token, path, config, prefix);

      // Ensure no duplicate variables
      if (cssRoot[variableName]) {
        throw new Error(`The variable "${variableName}" already exists.`);
      }

      cssRoot[variableName] = {
        value: resolvedValue,
        description: token.$description,
        deprecated: token.$deprecated,
      };

      // Handle `letter-spacing` for typography tokens as a separate CSS variable
      if (
        token.$type === "typography" &&
        !isTokenReference(getTokenValue(token))
      ) {
        handleTypographyToken(
          cssRoot,
          token as TypographyToken,
          path,
          config,
          prefix,
        );
      }
    });

    const fileHeaderText = fileHeader.fileHeader().join("\n * ");

    if (fileHeaderText === "") {
      return formatCSSOutput(cssRoot, selector);
    }

    return `${formatFileHeader(fileHeaderText)}
${formatCSSOutput(cssRoot, selector)}`;
  },
};

/**
 * Resolves the value of a token, giving precedence to custom extensions if available.
 * Uses `outputReferences` setting to determine if references or resolved values are used.
 * Wraps the resolved value in a CSS variable format.
 */
function resolveTokenValue(
  token: Token,
  path: string,
  config: FormatConfig,
  prefix?: string,
): string {
  const extension =
    (token.$extensions?.[CSS_EXTENSION] as Record<string, string>) ?? {};
  let value;
  const tokenValue = getTokenValue(token);

  // Check for custom extension's `value` and `resolvedValue`
  if (Object.keys(extension).length > 0) {
    value = config.outputReferences
      ? String(extension.value)
      : String(extension.resolvedValue ?? extension.value);
  } else if (config.outputReferences) {
    // Fall back to token's `$value` when outputting references
    value = stringifyTokenValue(token);
  } else if (token.$extensions?.[RESOLVED_EXTENSION]) {
    // Use resolved extension if available
    value = String(token.$extensions[RESOLVED_EXTENSION]);
  } else if (!isTokenReference(tokenValue)) {
    // Final fallback to `value` if it's not a reference
    value = stringifyTokenValue(token);
  } else {
    throw new Error(`No resolved value found in ${path}`);
  }

  return createVariable(value, prefix); // Wrap the value as a CSS variable
}

/**
 * Convert a token value to a CSS-compatible string.
 */
function stringifyTokenValue(token: Token): string {
  const tokenValue = getTokenValue(token);

  if (typeof tokenValue === "object" && tokenValue !== null) {
    if ("colorSpace" in tokenValue) {
      return structuredColorToCSS(tokenValue as StructuredColor);
    }

    if ("$ref" in tokenValue) {
      return tokenValue.$ref;
    }
  }

  return String(tokenValue);
}

/**
 * Convert a structured color to CSS color function syntax.
 */
function structuredColorToCSS(color: StructuredColor): string {
  if (color.hex) {
    return color.hex;
  }

  const components = color.components.join(" ");
  const alpha =
    color.alpha !== undefined && color.alpha !== 1 ? ` / ${color.alpha}` : "";

  switch (color.colorSpace) {
    case "srgb":
      return `color(srgb ${components}${alpha})`;
    case "srgb-linear":
      return `color(srgb-linear ${components}${alpha})`;
    case "display-p3":
      return `color(display-p3 ${components}${alpha})`;
    case "a98-rgb":
      return `color(a98-rgb ${components}${alpha})`;
    case "prophoto-rgb":
      return `color(prophoto-rgb ${components}${alpha})`;
    case "rec2020":
      return `color(rec2020 ${components}${alpha})`;
    case "xyz-d65":
      return `color(xyz-d65 ${components}${alpha})`;
    case "xyz-d50":
      return `color(xyz-d50 ${components}${alpha})`;
    case "hsl":
      return `hsl(${color.components[0]} ${color.components[1]}% ${color.components[2]}%${alpha})`;
    case "hwb":
      return `hwb(${color.components[0]} ${color.components[1]}% ${color.components[2]}%${alpha})`;
    case "lab":
      return `lab(${components}${alpha})`;
    case "lch":
      return `lch(${components}${alpha})`;
    case "oklab":
      return `oklab(${components}${alpha})`;
    case "oklch":
      return `oklch(${components}${alpha})`;
    default:
      return `color(${color.colorSpace} ${components}${alpha})`;
  }
}

/**
 * Handles the special case for typography tokens by creating
 * a `letter-spacing` CSS variable, if necessary.
 */
function handleTypographyToken(
  cssRoot: CSSRoot,
  token: TypographyToken,
  path: string,
  config: FormatConfig,
  prefix?: string,
) {
  const tokenValue = getTokenValue(token);
  if (isTokenReference(tokenValue)) return;
  if (typeof tokenValue !== "object" || tokenValue === null) return;
  if (
    !("letterSpacing" in tokenValue) ||
    tokenValue.letterSpacing === undefined
  ) {
    return;
  }

  const typographyValue = tokenValue as {
    letterSpacing: unknown;
  };

  const letterSpacingVariableName = `${createVariableName(path, prefix)}-letter-spacing`;
  const letterSpacingValue = config.outputReferences
    ? stringifyUnitValue(typographyValue.letterSpacing as never)
    : stringifyUnitValue(
        (((
          token.$extensions?.[RESOLVED_EXTENSION] as
            | Record<string, unknown>
            | undefined
        )?.letterSpacing as typeof typographyValue.letterSpacing) ??
          typographyValue.letterSpacing) as never,
      );

  if (cssRoot[letterSpacingVariableName]) {
    throw new Error(
      `The variable "${letterSpacingVariableName}" already exists.`,
    );
  }

  cssRoot[letterSpacingVariableName] = {
    value: createVariable(letterSpacingValue, prefix),
    description: `Letter spacing of "--${path}" CSS variable`,
  };
}

/**
 * Formats the CSS output by joining all CSS variables into a single string.
 */
function formatCSSOutput(cssRoot: CSSRoot, selector: string): string {
  return `${selector} {\n${Object.entries(cssRoot)
    .map(([key, { value, description, deprecated }]) => {
      const comments: string[] = [];
      if (deprecated) {
        comments.push(
          typeof deprecated === "string"
            ? `@deprecated ${deprecated}`
            : "@deprecated",
        );
      }
      if (description) {
        comments.push(description);
      }
      const comment =
        comments.length > 0 ? ` /* ${comments.join(" | ")} */` : "";
      return `  ${key}: ${value};${comment}`;
    })
    .join("\n")}\n}`;
}

/**
 *
 * @param message Message to display on top of the file
 */
function formatFileHeader(message: string): string {
  return `/**
 * ${message}
 */`;
}

/**
 * Replaces reference patterns in a value with CSS variables.
 */
function createVariable(value: string, prefix?: string): string {
  return value.replace(
    /{(.*?)}/g,
    (_, key) => `var(${createVariableName(key as string, prefix)})`,
  );
}

/**
 * Creates a CSS variable name from a given path.
 */
function createVariableName(path: string, prefix?: string): string {
  const escaped = cssEscape(path);
  return prefix ? `--${prefix}-${escaped}` : `--${escaped}`;
}

/**
 * CSS Escape function polyfill.
 *
 * @link https://github.com/mathiasbynens/CSS.escape
 */
function cssEscape(value: string) {
  const string = String(value);
  const length = string.length;
  let index = -1;
  let codeUnit;
  let result = "";
  const firstCodeUnit = string.charCodeAt(0);

  if (
    // If the character is the first character and is a `-` (U+002D), and
    // there is no second character, […]
    length == 1 &&
    firstCodeUnit == 0x002d
  ) {
    return "\\" + string;
  }

  while (++index < length) {
    codeUnit = string.charCodeAt(index);
    // Note: there's no need to special-case astral symbols, surrogate
    // pairs, or lone surrogates.

    // If the character is NULL (U+0000), then the REPLACEMENT CHARACTER
    // (U+FFFD).
    if (codeUnit == 0x0000) {
      result += "\uFFFD";
      continue;
    }

    if (
      // If the character is in the range [\1-\1F] (U+0001 to U+001F) or is
      // U+007F, […]
      (codeUnit >= 0x0001 && codeUnit <= 0x001f) ||
      codeUnit == 0x007f ||
      // If the character is the first character and is in the range [0-9]
      // (U+0030 to U+0039), […]
      (index == 0 && codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      // If the character is the second character and is in the range [0-9]
      // (U+0030 to U+0039) and the first character is a `-` (U+002D), […]
      (index == 1 &&
        codeUnit >= 0x0030 &&
        codeUnit <= 0x0039 &&
        firstCodeUnit == 0x002d)
    ) {
      // https://drafts.csswg.org/cssom/#escape-a-character-as-code-point
      result += "\\" + codeUnit.toString(16) + " ";
      continue;
    }

    // If the character is not handled by one of the above rules and is
    // greater than or equal to U+0080, is `-` (U+002D) or `_` (U+005F), or
    // is in one of the ranges [0-9] (U+0030 to U+0039), [A-Z] (U+0041 to
    // U+005A), or [a-z] (U+0061 to U+007A), […]
    if (
      codeUnit >= 0x0080 ||
      codeUnit == 0x002d ||
      codeUnit == 0x005f ||
      (codeUnit >= 0x0030 && codeUnit <= 0x0039) ||
      (codeUnit >= 0x0041 && codeUnit <= 0x005a) ||
      (codeUnit >= 0x0061 && codeUnit <= 0x007a)
    ) {
      // the character itself
      result += string.charAt(index);
      continue;
    }

    // Otherwise, the escaped character.
    // https://drafts.csswg.org/cssom/#escape-a-character
    result += "\\" + string.charAt(index);
  }
  return result;
}
