import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { cssFontTransform } from "builder/transforms/css/css-font-transform.js";
import { Token, TypographyToken } from "types/definitions.js";
import { applyTransform } from "utils/helpers.js";
import { RESOLVED_EXTENSION } from "utils/to-flat.js";
import { describe, expect, it } from "vitest";

describe("cssFontTransform", () => {
  it("should return the token unchanged if $type is not typography", () => {
    const token: Token = { $type: "color", $value: "#000000" };
    const result = applyTransform(cssFontTransform, token);
    expect(result).toEqual(token);
  });

  it("should transform a typography token with direct value", () => {
    const token: TypographyToken = {
      $type: "typography",
      $value: {
        fontWeight: "bold",
        fontSize: { value: 16, unit: "px" },
        letterSpacing: { value: 0, unit: "px" },
        lineHeight: 1.5,
        fontFamily: "Arial",
      },
    };
    const result = applyTransform(cssFontTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
      value: "bold 16px/1.5 Arial",
    });
  });

  it("should transform a typography token with reference value", () => {
    const token: TypographyToken = {
      $type: "typography",
      $value: "{referenceToken}",
    };
    const result = applyTransform(cssFontTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
      value: "{referenceToken}",
    });
  });

  it("should transform a typography token with resolved value", () => {
    const token: TypographyToken = {
      $type: "typography",
      $value: {
        fontWeight: "bold",
        fontSize: { value: 16, unit: "px" },
        lineHeight: 1.5,
        letterSpacing: { value: 0, unit: "px" },
        fontFamily: "Arial",
      },
      $extensions: {
        [RESOLVED_EXTENSION]: {
          fontWeight: "normal",
          fontSize: { value: 14, unit: "px" },
          lineHeight: 1.2,
          letterSpacing: { value: 0, unit: "px" },
          fontFamily: "Helvetica",
        },
      },
    };
    const result = applyTransform(cssFontTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
      value: "bold 16px/1.5 Arial",
      resolvedValue: "normal 14px/1.2 Helvetica",
    });
  });

  it("should add $extensions if not present", () => {
    const token: TypographyToken = {
      $type: "typography",
      $value: {
        fontWeight: "bold",
        fontSize: { value: 16, unit: "px" },
        lineHeight: 1.5,
        letterSpacing: { value: 0, unit: "px" },
        fontFamily: "Arial",
      },
    };
    const result = applyTransform(cssFontTransform, token);
    // @ts-expect-error
    expect(result.$extensions).toBeDefined();

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
      value: "bold 16px/1.5 Arial",
    });
  });
});
