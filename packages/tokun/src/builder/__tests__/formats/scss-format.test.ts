import { emptyFileHeader } from "builder/file-headers/empty-file-header.js";
import { scssFormat } from "builder/formats/scss-format.js";
import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { RESOLVED_EXTENSION } from "builder/loaders/dtcg-json-loader.js";
import { FlattenTokens } from "utils/to-flat.js";
import { describe, expect, it } from "vitest";

describe("scssFormat", () => {
  it("should format tokens to SCSS variables", () => {
    const tokens: FlattenTokens = new Map([
      [
        "color.primary",
        {
          $value: "#ff0000",
          $description: "Primary color",
        },
      ],
      [
        "color.secondary",
        {
          $value: "#00ff00",
        },
      ],
    ]);

    const result = scssFormat.formatter({
      tokens,
      config: {},
      fileHeader: emptyFileHeader,
    });

    expect(result).toBe(
      `$color-primary: #ff0000; // Primary color
$color-secondary: #00ff00;
`,
    );
  });

  it("should use CSS extension values when available", () => {
    const tokens: FlattenTokens = new Map([
      [
        "color.primary",
        {
          $value: "#ff0000",
          $extensions: {
            [CSS_EXTENSION]: {
              value: "transformed-value",
              resolvedValue: "resolved-transformed",
            },
          },
        },
      ],
    ]);

    const result = scssFormat.formatter({
      tokens,
      config: { outputReferences: false },
      fileHeader: emptyFileHeader,
    });

    expect(result).toBe("$color-primary: resolved-transformed;\n");
  });

  it("should output references when outputReferences is true", () => {
    const tokens: FlattenTokens = new Map([
      [
        "color.primary",
        {
          $value: "{color.secondary}",
          $extensions: {
            [CSS_EXTENSION]: {
              value: "{color-secondary}",
              resolvedValue: "#00ff00",
            },
          },
        },
      ],
    ]);

    const result = scssFormat.formatter({
      tokens,
      config: { outputReferences: true },
      fileHeader: emptyFileHeader,
    });

    expect(result).toBe("$color-primary: {color-secondary};\n");
  });

  it("should use resolved extension when no CSS extension", () => {
    const tokens: FlattenTokens = new Map([
      [
        "color.alias",
        {
          $value: "{color.primary}",
          $extensions: {
            [RESOLVED_EXTENSION]: "#ff0000",
          },
        },
      ],
    ]);

    const result = scssFormat.formatter({
      tokens,
      config: { outputReferences: false },
      fileHeader: emptyFileHeader,
    });

    expect(result).toBe("$color-alias: #ff0000;\n");
  });

  it("should throw error when no resolved value found for reference", () => {
    const tokens: FlattenTokens = new Map([
      [
        "color.alias",
        {
          $value: "{color.missing}",
          $extensions: {},
        },
      ],
    ]);

    expect(() =>
      scssFormat.formatter({
        tokens,
        config: { outputReferences: false },
        fileHeader: emptyFileHeader,
      }),
    ).toThrowError("No resolved value found");
  });
});
