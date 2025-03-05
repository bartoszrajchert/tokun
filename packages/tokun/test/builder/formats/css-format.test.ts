import { CSS_EXTENSION, cssFormat } from "builder/formats/css-format.js";
import { FlattenTokens } from "utils/to-flat.js";
import { describe, expect, it } from "vitest";

describe("cssFormat", () => {
  it("should format tokens to CSS variables", () => {
    const tokens: FlattenTokens = new Map([
      [
        "color-primary",
        {
          $value: "#ff0000",
          $description: "Color primary",
          $extensions: {
            [CSS_EXTENSION]: { value: "#ff0000", resolvedValue: "#ff0000" },
          },
        },
      ],
      [
        "color-secondary",
        {
          $value: "#111111",
          $extensions: {
            [CSS_EXTENSION]: { value: "#111111", resolvedValue: "#111111" },
          },
        },
      ],
      [
        "typography-heading",
        {
          $value: {
            fontFamily: "Arial",
            fontSize: { value: 16, unit: "px" },
            fontWeight: "normal",
            letterSpacing: { value: 1, unit: "px" },
            lineHeight: 1.5,
          },
          $type: "typography",
          $description: "Typography heading",
          $extensions: {
            [CSS_EXTENSION]: {
              value: "bold 16px/1.5 Arial",
              resolvedValue: "bold 16px/1.5 Arial",
            },
          },
        },
      ],
    ]);

    const config = { outputReferences: false };

    const result = cssFormat.formatter({ tokens, config });

    expect(result).toBe(
      `:root {
  --color-primary: #ff0000; /* Color primary */
  --color-secondary: #111111;
  --typography-heading: bold 16px/1.5 Arial; /* Typography heading */
  --typography-heading-letter-spacing: 1px; /* Typography heading */
}`,
    );
  });

  it("should throw an error if no resolved value is found when value has a reference", () => {
    const tokens: FlattenTokens = new Map([
      [
        "color-primary",
        {
          $value: "{color-secondary}",
          $extensions: {},
        },
      ],
    ]);

    const config = { outputReferences: false };

    expect(() => cssFormat.formatter({ tokens, config })).toThrowError(
      "No resolved value found",
    );
  });

  it("should handle references in values", () => {
    const tokens: FlattenTokens = new Map([
      [
        "color-primary",
        {
          $value: "{color-secondary}",
          $extensions: {
            [CSS_EXTENSION]: {
              value: "{color-secondary}",
              resolvedValue: "#00ff00",
            },
          },
        },
      ],
    ]);

    const config = { outputReferences: true };

    const result = cssFormat.formatter({ tokens, config });

    expect(result).toBe(
      `:root {\n  --color-primary: var(--color-secondary);\n}`,
    );
  });

  it("should handle typography tokens with letter-spacing", () => {
    const tokens: FlattenTokens = new Map([
      [
        "typography-heading",
        {
          $value: {
            fontFamily: "Arial",
            fontSize: { value: 16, unit: "px" },
            fontWeight: "normal",
            letterSpacing: { value: 1, unit: "px" },
            lineHeight: 1.5,
          },
          $type: "typography",
          $extensions: {
            [CSS_EXTENSION]: {
              value: "bold 16px/1.5 Arial",
              resolvedValue: "bold 16px/1.5 Arial",
            },
          },
        },
      ],
    ]);

    const config = { outputReferences: false };

    const result = cssFormat.formatter({ tokens, config });

    expect(result).toBe(
      `:root {\n  --typography-heading: bold 16px/1.5 Arial;\n  --typography-heading-letter-spacing: 1px;\n}`,
    );
  });

  it("should throw an error if letter-spacing variable already exists", () => {
    const tokens: FlattenTokens = new Map([
      [
        "typography-heading",
        {
          $value: {
            fontFamily: "Arial",
            fontSize: { value: 16, unit: "px" },
            fontWeight: "normal",
            letterSpacing: { value: 1, unit: "px" },
            lineHeight: 1.5,
          },
          $type: "typography",
          $extensions: {
            [CSS_EXTENSION]: {
              value: "bold 16px/1.5 Arial",
              resolvedValue: "bold 16px/1.5 Arial",
            },
          },
        },
      ],
      [
        "typography-heading-letter-spacing",
        {
          $type: "dimension",
          $value: {
            value: 1,
            unit: "px",
          },
          $extensions: {
            [CSS_EXTENSION]: {
              value: "1111px",
              resolvedValue: "1111px",
            },
          },
        },
      ],
    ]);

    const config = { outputReferences: false };

    expect(() => cssFormat.formatter({ tokens, config })).toThrow(
      'The variable "--typography-heading-letter-spacing" already exists.',
    );
  });

  it("should handle tokens without extensions", () => {
    const tokens: FlattenTokens = new Map([
      [
        "color-primary",
        {
          $value: "#ff0000",
        },
      ],
    ]);

    const config = { outputReferences: false };

    const result = cssFormat.formatter({ tokens, config });

    expect(result).toBe(`:root {\n  --color-primary: #ff0000;\n}`);
  });

  it("should handle composite values", () => {
    const tokens: FlattenTokens = new Map([
      [
        "shadow-default",
        {
          $value: {
            offsetX: { value: 0, unit: "px" },
            offsetY: { value: 4, unit: "px" },
            blur: { value: 10, unit: "px" },
            spread: { value: 0, unit: "px" },
            color: "#000000",
          },
          $extensions: {
            [CSS_EXTENSION]: {
              value: "0px 4px 10px 0px #000000",
              resolvedValue: "0px 4px 10px 0px #000000",
            },
          },
        },
      ],
    ]);

    const config = { outputReferences: false };

    const result = cssFormat.formatter({ tokens, config });

    expect(result).toBe(
      `:root {\n  --shadow-default: 0px 4px 10px 0px #000000;\n}`,
    );
  });
});
