import { build } from "builder/tokun.js";
import { Platform } from "types/define-config.js";
import { Loader } from "utils/types.js";
import { dtcgValidator } from "validators/dtcg-validator.js";
import { describe, expect, it, vi } from "vitest";

describe("parseDesignTokens with mocks", () => {
  const mockParser: Loader = {
    name: "test",
    loadFn: vi.fn().mockReturnValue(new Map()),
    pattern: /\.json$/,
  };

  const mockPlatform: Platform = {
    format: {
      name: "testFormat",
      formatter: vi.fn().mockReturnValue("formatted"),
    },
    outputs: [{ name: "test.json" }],
    name: "testPlatform",
  };

  it("should validate tokens and throw error for invalid content", () => {
    const invalidObj = { invalid: "content" };

    expect(() =>
      build({
        data: invalidObj,
        options: {
          validator: dtcgValidator,
          loader: mockParser,
          platforms: [mockPlatform],
        },
      }),
    ).toThrowError();
  });

  it("should parse and format valid tokens", () => {
    const validObj = {
      $type: "color",
      tokens: {},
    };

    const result = build({
      data: validObj,
      options: {
        loader: mockParser,
        platforms: [mockPlatform],
      },
    });

    expect(result).toEqual([
      {
        name: "test.json",
        content: "formatted",
      },
    ]);
  });

  it("should apply transforms when provided", () => {
    const validObj = {
      $type: "color",
      tokens: {},
    };

    const transformFormat: Platform = {
      ...mockPlatform,
      transforms: [
        {
          type: "name",
          name: "test",
          transformer: (name: string) => name.toUpperCase(),
        },
      ],
    };

    const result = build({
      data: validObj,
      options: {
        loader: mockParser,
        platforms: [transformFormat],
      },
    });

    expect(result).toEqual([
      {
        name: "test.json",
        content: "formatted",
      },
    ]);
  });

  it("should apply file filters when provided", () => {
    const validObj = {
      $type: "color",
      tokens: {},
    };

    const filterFormat: Platform = {
      ...mockPlatform,
      outputs: [
        {
          name: "test.json",
          filter: () => true,
        },
      ],
    };

    const result = build({
      data: validObj,
      options: {
        loader: mockParser,
        platforms: [filterFormat],
      },
    });

    expect(result).toEqual([
      {
        name: "test.json",
        content: "formatted",
      },
    ]);
  });
});

describe("parseDesignTokens", () => {
  it("should parse and format valid tokens", () => {
    const validObj = {
      brand: {
        color: {
          $type: "color",
          "": {
            $value: "#123456",
            $description: "Default color",
          },
          white: {
            $value: "#ffffff",
            $description: "White color",
          },
          black: {
            $value: "#000000",
            $description: "Black color",
          },
        },
        typography: {
          header: {
            fontFamily: {
              $type: "fontFamily",
              $value: ["Arial", "sans-serif"],
            },
            fontSize: {
              $type: "dimension",
              $value: {
                value: 24,
                unit: "px",
              },
            },
            fontWeight: {
              $type: "fontWeight",
              $value: 500,
            },
          },
        },
      },
      alias: {
        $description: "Alias",
        color: {
          $description: "Color alias",
          primary: {
            $type: "color",
            $value: "{brand.color.white}",
            $description: "Primary color",
          },
          secondary: {
            $type: "color",
            $value: "{brand.color.black}",
            $description: "Secondary color",
          },
        },
        gradient: {
          $type: "gradient",
          $value: [
            { color: "{brand.color}", position: 0 },
            { color: "{brand.color.black}", position: 1 },
          ],
        },
        typography: {
          $description: "Typography alias",
          header: {
            $type: "typography",
            $value: {
              fontFamily: "{brand.typography.header.fontFamily}",
              fontSize: "{brand.typography.header.fontSize}",
              fontWeight: "{brand.typography.header.fontWeight}",
              letterSpacing: {
                value: 0.1,
                unit: "rem",
              },
              lineHeight: 1.2,
            },
            $description: "Header typography",
          },
        },
      },
    };

    const result = build({
      data: validObj,
      options: {
        loader: "dtcg-json",
        platforms: [
          {
            name: "css",
            format: "css",
            transforms: ["kebab-case", "css-transforms"],
            outputs: [{ name: "test.css" }],
            config: { outputReferences: true },
          },
        ],
      },
    });

    expect(result).toEqual([
      {
        name: "test.css",
        content: `/**
 * File generated automatically, do not edit manually
 */
:root {
  --alias-color-primary: var(--brand-color-white); /* Primary color */
  --alias-color-secondary: var(--brand-color-black); /* Secondary color */
  --alias-gradient: linear-gradient(90deg, var(--brand-color) 0%, var(--brand-color-black) 100%);
  --alias-typography-header: var(--brand-typography-header-font-weight) var(--brand-typography-header-font-size)/1.2 var(--brand-typography-header-font-family); /* Header typography */
  --alias-typography-header-letter-spacing: 0.1rem; /* Letter spacing of "--alias-typography-header" CSS variable */
  --brand-color: #123456; /* Default color */
  --brand-color-black: #000000; /* Black color */
  --brand-color-white: #ffffff; /* White color */
  --brand-typography-header-font-family: Arial,sans-serif;
  --brand-typography-header-font-size: 24px;
  --brand-typography-header-font-weight: 500;
}`,
      },
    ]);
  });
});
