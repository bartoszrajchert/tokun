import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { cssDimensionTransform } from "builder/transforms/css/css-dimension-transform.js";
import { DimensionToken, Token } from "types/definitions.js";
import { applyTransform } from "utils/helpers.js";
import { RESOLVED_EXTENSION } from "utils/to-flat.js";
import { describe, expect, it } from "vitest";

describe("cssDimensionTransform", () => {
  it("should return the token unchanged if $type is not 'dimension'", () => {
    const token: Token = { $type: "color", $value: "#000000" };
    const result = applyTransform(cssDimensionTransform, token);
    expect(result).toEqual(token);
  });

  it("should transform a dimension token without reference", () => {
    const token: DimensionToken = {
      $type: "dimension",
      $value: {
        value: 10,
        unit: "px",
      },
    };
    const result = applyTransform(cssDimensionTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]?.value).toBe("10px");
  });

  it("should transform a dimension token with reference", () => {
    const token: DimensionToken = { $type: "dimension", $value: "{reference}" };
    const result = applyTransform(cssDimensionTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]?.value).toBe("{reference}");
  });

  it("should transform a dimension token with resolved value", () => {
    const token: DimensionToken = {
      $type: "dimension",
      $value: "{reference}",
      $extensions: {
        [RESOLVED_EXTENSION]: {
          value: 20,
          unit: "px",
        },
      },
    };
    const result = applyTransform(cssDimensionTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]?.resolvedValue).toBe("20px");
  });

  it("should add CSS_EXTENSION to $extensions if not present", () => {
    const token: DimensionToken = {
      $type: "dimension",
      $value: {
        value: 10,
        unit: "px",
      },
    };
    const result = applyTransform(cssDimensionTransform, token);

    // @ts-expect-error
    expect(result.$extensions).toHaveProperty(CSS_EXTENSION);
  });

  it("should not modify the token if no transformation is needed", () => {
    const token: DimensionToken = { $type: "dimension", $value: "{reference}" };
    const result = applyTransform(cssDimensionTransform, token);
    expect(result).toEqual(token);
  });

  it("should handle dimension token with 'px' value", () => {
    const token: DimensionToken = {
      $type: "dimension",
      $value: {
        value: 15,
        unit: "px",
      },
    };
    const result = applyTransform(cssDimensionTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]?.value).toBe("15px");
  });

  it("should handle dimension token with 'rem' value", () => {
    const token: DimensionToken = {
      $type: "dimension",
      $value: {
        value: 1.5,
        unit: "rem",
      },
    };
    const result = applyTransform(cssDimensionTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]?.value).toBe("1.5rem");
  });
});
