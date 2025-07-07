import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import { isReference, stringifyUnitValue } from "utils/token-utils.js";
import { Format } from "utils/types.js";

type CSSRoot = Record<
  string,
  {
    value: string;
    description?: string;
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
    const cssRoot: CSSRoot = {};

    tokens.forEach((token, path) => {
      const variableName = createVariableName(path);
      const resolvedValue = resolveTokenValue(token, path, config);

      // Ensure no duplicate variables
      if (cssRoot[variableName]) {
        throw new Error(`The variable "${variableName}" already exists.`);
      }

      cssRoot[variableName] = {
        value: resolvedValue,
        description: token.$description,
      };

      // Handle `letter-spacing` for typography tokens as a separate CSS variable
      if (token.$type === "typography" && !isReference(token.$value)) {
        handleTypographyToken(cssRoot, token, path, config);
      }
    });

    const fileHeaderText = fileHeader.fileHeader().join("\n * ");

    if (fileHeaderText === "") {
      return formatCSSOutput(cssRoot);
    }

    return `${formatFileHeader(fileHeaderText)}
${formatCSSOutput(cssRoot)}`;
  },
};

/**
 * Resolves the value of a token, giving precedence to custom extensions if available.
 * Uses `outputReferences` setting to determine if references or resolved values are used.
 * Wraps the resolved value in a CSS variable format.
 *
 * @param token - Token to resolve value from
 * @param path - Path of the token
 * @param config - Configuration specifying output reference usage
 * @returns The resolved value as a CSS variable
 * @throws Error if no resolved value is found
 */
function resolveTokenValue(
  token: any,
  path: string,
  config: { outputReferences: boolean },
): string {
  const extension = token.$extensions?.[CSS_EXTENSION] ?? {};
  let value;

  // Check for custom extension's `value` and `resolvedValue`
  if (Object.keys(extension).length > 0) {
    value = config.outputReferences
      ? String(extension.value)
      : String(extension.resolvedValue ?? extension.value);
  } else if (config.outputReferences) {
    // Fall back to token's `$value` when outputting references
    value = String(token.$value);
  } else if (token.$extensions?.[RESOLVED_EXTENSION]) {
    // Use resolved extension if available
    value = String(token.$extensions[RESOLVED_EXTENSION]);
  } else if (!isReference(token.$value)) {
    // Final fallback to `value` if it's not a reference
    value = String(token.$value);
  } else {
    throw new Error(`No resolved value found in ${path}`);
  }

  return createVariable(value); // Wrap the value as a CSS variable
}

/**
 * Handles the special case for typography tokens by creating
 * a `letter-spacing` CSS variable, if necessary.
 *
 * @param cssRoot - Root CSS object to store variables
 * @param token - Typography token with letterSpacing property
 * @param path - Path of the typography token
 * @param config - Configuration specifying output reference usage
 */
function handleTypographyToken(
  cssRoot: CSSRoot,
  token: any,
  path: string,
  config: { outputReferences: boolean },
) {
  const letterSpacingVariableName = `${createVariableName(path)}-letter-spacing`;
  const letterSpacingValue = config.outputReferences
    ? stringifyUnitValue(token.$value.letterSpacing)
    : stringifyUnitValue(
        token.$extensions?.[RESOLVED_EXTENSION]?.letterSpacing ??
          token.$value.letterSpacing,
      );

  if (cssRoot[letterSpacingVariableName]) {
    throw new Error(
      `The variable "${letterSpacingVariableName}" already exists.`,
    );
  }

  cssRoot[letterSpacingVariableName] = {
    value: createVariable(letterSpacingValue),
    description: `Letter spacing of "--${path}" CSS variable`,
  };
}

/**
 * Formats the CSS output by joining all CSS variables into a single string.
 *
 * @param cssRoot - Root CSS object containing variable definitions
 * @returns The formatted CSS output string
 */
function formatCSSOutput(cssRoot: CSSRoot): string {
  return `:root {\n${Object.entries(cssRoot)
    .map(
      ([key, { value, description }]) =>
        `  ${key}: ${value};${description ? ` /* ${description} */` : ""}`,
    )
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
 *
 * @param value - The value to convert to a CSS variable
 * @returns The modified value with CSS variable references
 */
function createVariable(value: string): string {
  return value.replace(
    /{(.*?)}/g,
    (_, key) => `var(${createVariableName(key)})`,
  );
}

/**
 * Creates a CSS variable name from a given path.
 *
 * @param path - The path to create a variable name from
 * @returns The CSS variable name
 */
function createVariableName(path: string): string {
  return `--${cssEscape(path)}`;
}

/**
 * CSS Escape function polyfill.
 *
 * @link https://github.com/mathiasbynens/CSS.escape
 */
function cssEscape(value: any) {
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
    // Note: there’s no need to special-case astral symbols, surrogate
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
