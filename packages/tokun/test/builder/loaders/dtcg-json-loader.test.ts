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

  it("should fix gradient position", () => {
    const content = {
      gradient: {
        $type: "gradient",
        $value: [
          { color: "#000000", position: -1 },
          { color: "#000000", position: 1.5 },
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
        $value: 40,
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
        $value: 40,
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
            inset: true,
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
            inset: true,
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
              inset: true,
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

  it.todo(
    "should throw error for invalid JSON content and provide error message",
  );
});
