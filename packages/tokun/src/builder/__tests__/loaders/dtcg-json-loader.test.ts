import { dtcgJsonLoader } from "builder/loaders/dtcg-json-loader.js";
import { TokenGroup } from "types/definitions.js";
import { describe, expect, it } from "vitest";

describe("Test DTCG JSON Loader", () => {
  it("should load and parse JSON content", () => {
    const content = {
      brand: {
        color: {
          primary: {
            $value: "#000000",
            $type: "color",
          },
        },
      },
      semantic: {
        color: {
          primary: {
            $value: "{brand.color.primary}",
            $type: "color",
          },
        },
      },
    } satisfies TokenGroup;

    const tokens = dtcgJsonLoader.loadFn({ content });

    expect(Object.fromEntries(tokens)).toEqual({
      "brand.color.primary": {
        $value: "#000000",
        $type: "color",
      },
      "semantic.color.primary": {
        $value: "{brand.color.primary}",
        $type: "color",
        $extensions: {
          "com.tokun.resolvedValue": "#000000",
        },
      },
    });
  });

  it("should load empty object", () => {
    const content = {};
    const tokens = dtcgJsonLoader.loadFn({ content });

    expect(Object.fromEntries(tokens)).toEqual({});
  });

  it("should resolve curly references targeting $root tokens", () => {
    const content = {
      brand: {
        color: {
          $type: "color",
          $root: {
            $value: "#123456",
          },
          white: {
            $value: "#ffffff",
          },
        },
      },
      alias: {
        color: {
          $type: "color",
          $value: "{brand.color.$root}",
        },
        gradient: {
          $type: "gradient",
          $value: [
            { color: "{brand.color.$root}", position: 0 },
            { color: "{brand.color.white}", position: 1 },
          ],
        },
      },
    } satisfies TokenGroup;

    const tokens = dtcgJsonLoader.loadFn({ content });

    expect(Object.fromEntries(tokens)).toEqual({
      "alias.color": {
        $type: "color",
        $value: "{brand.color.$root}",
        $extensions: {
          "com.tokun.resolvedValue": "#123456",
        },
      },
      "alias.gradient": {
        $type: "gradient",
        $value: [
          { color: "{brand.color.$root}", position: 0 },
          { color: "{brand.color.white}", position: 1 },
        ],
        $extensions: {
          "com.tokun.resolvedValue": [
            { color: "#123456", position: 0 },
            { color: "#ffffff", position: 1 },
          ],
        },
      },
      "brand.color": {
        $type: "color",
        $value: "#123456",
      },
      "brand.color.white": {
        $type: "color",
        $value: "#ffffff",
      },
    });
  });

  it("should fix gradient position (0-1 range)", () => {
    const content = {
      gradient: {
        $type: "gradient",
        $value: [
          { color: "#000000", position: -1 },
          { color: "#000000", position: 150 },
        ],
      },
    } satisfies TokenGroup;

    const tokens = dtcgJsonLoader.loadFn({ content });

    expect(Object.fromEntries(tokens)).toEqual({
      gradient: {
        $type: "gradient",
        $value: [
          { color: "#000000", position: 0 },
          { color: "#000000", position: 1 },
        ],
      },
    });
  });

  it("should fix gradient position with reference", () => {
    const content = {
      color: {
        $type: "color",
        $value: "#000000",
      },
      color2: {
        $type: "color",
        $value: "{color}",
      },
      color3: {
        $type: "color",
        $value: "{color2}",
      },
      firstNumber: {
        $type: "number",
        $value: -1.2,
      },
      secondNumber: {
        $type: "number",
        $value: 400,
      },
      gradient: {
        $type: "gradient",
        $value: [
          { color: "{color}", position: "{firstNumber}" },
          { color: "{color}", position: "{secondNumber}" },
        ],
      },
      gradient2: {
        $type: "gradient",
        $value: "{gradient}",
      },
      gradient3: {
        $type: "gradient",
        $value: "{gradient2}",
      },
    } satisfies TokenGroup;

    const tokens = dtcgJsonLoader.loadFn({ content });

    expect(Object.fromEntries(tokens)).toEqual({
      color: {
        $type: "color",
        $value: "#000000",
      },
      color2: {
        $type: "color",
        $value: "{color}",
        $extensions: {
          "com.tokun.resolvedValue": "#000000",
        },
      },
      color3: {
        $type: "color",
        $value: "{color2}",
        $extensions: {
          "com.tokun.resolvedValue": "#000000",
        },
      },
      firstNumber: {
        $type: "number",
        $value: -1.2,
      },
      secondNumber: {
        $type: "number",
        $value: 400,
      },
      gradient: {
        $type: "gradient",
        $value: [
          { color: "{color}", position: "{firstNumber}" },
          { color: "{color}", position: "{secondNumber}" },
        ],
        $extensions: {
          "com.tokun.resolvedValue": [
            { color: "#000000", position: 0 },
            { color: "#000000", position: 1 },
          ],
        },
      },
      gradient2: {
        $type: "gradient",
        $value: "{gradient}",
        $extensions: {
          "com.tokun.resolvedValue": [
            { color: "#000000", position: 0 },
            { color: "#000000", position: 1 },
          ],
        },
      },
      gradient3: {
        $type: "gradient",
        $value: "{gradient2}",
        $extensions: {
          "com.tokun.resolvedValue": [
            { color: "#000000", position: 0 },
            { color: "#000000", position: 1 },
          ],
        },
      },
    });
  });

  it("should handle composite tokens with deep references", () => {
    const content = {
      color: {
        $type: "color",
        $value: "#000000",
      },
      fontFamily: {
        $type: "fontFamily",
        $value: ["Arial", "Helvetica", "sans-serif"],
      },
      dimension: {
        $type: "dimension",
        $value: {
          value: 16,
          unit: "px",
        },
      },
      fontWeight: {
        $type: "number",
        $value: 400,
      },
      typography: {
        $type: "typography",
        $value: {
          fontFamily: "{fontFamily}",
          fontSize: "{dimension}",
          fontWeight: "{fontWeight}",
          lineHeight: 1.5,
          letterSpacing: {
            value: 0.1,
            unit: "px",
          },
        },
      },
      typography2: {
        $type: "typography",
        $value: "{typography}",
      },
      shadow: {
        $type: "shadow",
        $value: [
          {
            color: "{color}",
            offsetX: "{dimension}",
            offsetY: "{dimension}",
            blur: "{dimension}",
            spread: "{dimension}",
          },
        ],
      },
    } satisfies TokenGroup;

    const tokens = dtcgJsonLoader.loadFn({ content });

    expect(Object.fromEntries(tokens)).toEqual({
      color: {
        $type: "color",
        $value: "#000000",
      },
      fontFamily: {
        $type: "fontFamily",
        $value: ["Arial", "Helvetica", "sans-serif"],
      },
      dimension: {
        $type: "dimension",
        $value: {
          value: 16,
          unit: "px",
        },
      },
      fontWeight: {
        $type: "number",
        $value: 400,
      },
      typography: {
        $type: "typography",
        $value: {
          fontFamily: "{fontFamily}",
          fontSize: "{dimension}",
          fontWeight: "{fontWeight}",
          lineHeight: 1.5,
          letterSpacing: {
            value: 0.1,
            unit: "px",
          },
        },
        $extensions: {
          "com.tokun.resolvedValue": {
            fontFamily: ["Arial", "Helvetica", "sans-serif"],
            fontSize: {
              value: 16,
              unit: "px",
            },
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: {
              value: 0.1,
              unit: "px",
            },
          },
        },
      },
      shadow: {
        $type: "shadow",
        $value: [
          {
            color: "{color}",
            offsetX: "{dimension}",
            offsetY: "{dimension}",
            blur: "{dimension}",
            spread: "{dimension}",
          },
        ],
        $extensions: {
          "com.tokun.resolvedValue": [
            {
              color: "#000000",
              offsetX: {
                value: 16,
                unit: "px",
              },
              offsetY: {
                value: 16,
                unit: "px",
              },
              blur: {
                value: 16,
                unit: "px",
              },
              spread: {
                value: 16,
                unit: "px",
              },
            },
          ],
        },
      },
      typography2: {
        $type: "typography",
        $value: "{typography}",
        $extensions: {
          "com.tokun.resolvedValue": {
            fontFamily: ["Arial", "Helvetica", "sans-serif"],
            fontSize: {
              value: 16,
              unit: "px",
            },
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: {
              value: 0.1,
              unit: "px",
            },
          },
        },
      },
    });
  });

  it("should throw error for invalid reference in token", () => {
    const content = {
      color: {
        $type: "color",
        $value: "{colorr}",
      },
    } satisfies TokenGroup;

    expect(() => dtcgJsonLoader.loadFn({ content })).toThrowError();
  });

  it("should throw error when JSON Pointer $ref syntax is used", () => {
    const content = {
      color: {
        $type: "color",
        $value: {
          $ref: "#/base/color",
        },
      },
    } as TokenGroup;

    expect(() => dtcgJsonLoader.loadFn({ content })).toThrowError(
      "JSON Pointer $ref references are not supported",
    );
  });

  it.each([
    [
      "object",
      {
        typography: {
          $type: "typography",
          $value: {
            fontFamily: "{wrong}",
            fontSize: "{wrong}",
            fontWeight: "{wrong}",
            lineHeight: 1.5,
            letterSpacing: {
              value: 0.1,
              unit: "px",
            },
          },
        },
      },
    ],
    [
      "direct",
      {
        shadow: {
          $type: "shadow",
          $value: "{wrong}",
        },
      },
    ],
    [
      "array",
      {
        primaryFontFamily: {
          $type: "fontFamily",
          $value: ["{wrong}"],
        },
      },
    ],
  ])(
    "should throw error for invalid reference in composite token — %s",
    (_, content) => {
      expect(() =>
        dtcgJsonLoader.loadFn({ content: content as TokenGroup }),
      ).toThrowError(`Reference wrong not found`);
    },
  );

  it("should throw error when circular reference is found", () => {
    const content = {
      color: {
        $type: "color",
        $value: "{color}",
      },
    } satisfies TokenGroup;

    expect(() => dtcgJsonLoader.loadFn({ content })).toThrowError(
      "Circular reference detected",
    );
  });

  it("should resolve $extends group inheritance", () => {
    const content = {
      base: {
        $type: "color",
        primary: {
          $value: "#ff0000",
        },
        secondary: {
          $value: "#00ff00",
        },
      },
      theme: {
        $type: "color",
        $extends: "{base}",
        primary: {
          $value: "#0000ff",
        },
      },
    } as TokenGroup;

    const tokens = dtcgJsonLoader.loadFn({ content });
    const result = Object.fromEntries(tokens);

    // theme.primary should be overridden, theme.secondary inherited from base
    expect(
      (result["theme.primary"] as { $value: string } | undefined)?.$value,
    ).toBe("#0000ff");
    expect(
      (result["theme.secondary"] as { $value: string } | undefined)?.$value,
    ).toBe("#00ff00");
  });

  it.todo(
    "should throw error for invalid JSON content and provide error message",
  );
});
