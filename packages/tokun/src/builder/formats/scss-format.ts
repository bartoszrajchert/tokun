import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import { Token } from "types/definitions.js";
import { getTokenValue, isTokenReference } from "utils/token-utils.js";
import { Format } from "utils/types.js";
import { CSS_EXTENSION, stringifyCssValue } from "./css-format.js";

/**
 * SCSS formatter.
 * Generates `$variable-name: value;` output.
 */
export const scssFormat: Format = {
  name: "scss",
  formatter: ({ tokens, config, fileHeader }) => {
    const outputReferences = config.outputReferences ?? false;
    const lines: string[] = [];

    const fileHeaderText = fileHeader.fileHeader().join("\n// ");
    if (fileHeaderText !== "") {
      lines.push(`// ${fileHeaderText}`);
    }

    tokens.forEach((token, path) => {
      const variableName = `$${path.replace(/\./g, "-")}`;
      const value = resolveScssValue(token, path, outputReferences);
      const comment = token.$description ? ` // ${token.$description}` : "";
      lines.push(`${variableName}: ${value};${comment}`);
    });

    return lines.join("\n") + "\n";
  },
};

function resolveScssValue(
  token: Token,
  path: string,
  outputReferences: boolean,
): string {
  const extension =
    (token.$extensions?.[CSS_EXTENSION] as Record<string, string>) ?? {};
  const tokenValue = getTokenValue(token);

  if (Object.keys(extension).length > 0) {
    return outputReferences
      ? String(extension.value)
      : String(extension.resolvedValue ?? extension.value);
  }

  if (outputReferences) {
    return stringifyCssValue(tokenValue);
  }

  if (token.$extensions?.[RESOLVED_EXTENSION]) {
    return stringifyCssValue(token.$extensions[RESOLVED_EXTENSION]);
  }

  if (!isTokenReference(tokenValue)) {
    return stringifyCssValue(tokenValue);
  }

  throw new Error(`No resolved value found in ${path}`);
}
