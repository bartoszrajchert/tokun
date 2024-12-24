import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { cssShadowTransform } from "builder/transforms/css/css-shadow-transform.js";
import { ShadowToken, Token } from "types/definitions.js";
import { applyTransform } from "utils/helpers.js";
import { RESOLVED_EXTENSION } from "utils/to-flat.js";
import { describe, expect, it } from "vitest";

describe("cssShadowTransform", () => {
  it("should return the token unchanged if $type is not shadow", () => {
    const token: Token = { $type: "color", $value: "#000000" };
    const result = applyTransform(cssShadowTransform, token);
    expect(result).toEqual(token);
  });

  it("should transform a single shadow token correctly", () => {
    const token: ShadowToken = {
      $type: "shadow",
      $value: {
        offsetX: { value: 10, unit: "px" },
        offsetY: { value: 10, unit: "px" },
        blur: { value: 5, unit: "px" },
        spread: { value: 2, unit: "px" },
        color: "#000000",
        inset: true,
      },
    };
    const result = applyTransform(cssShadowTransform, token);

    // @ts-expect-error
    expect(result.$extensions[CSS_EXTENSION].value).toBe(
      "10px 10px 5px 2px #000000 inset",
    );
  });

  it("should transform an array of shadow tokens correctly", () => {
    const token: ShadowToken = {
      $type: "shadow",
      $value: [
        {
          offsetX: { value: 10, unit: "px" },
          offsetY: { value: 10, unit: "px" },
          blur: { value: 5, unit: "px" },
          spread: { value: 2, unit: "px" },
          color: "#000000",
          inset: true,
        },
        {
          offsetX: { value: 5, unit: "px" },
          offsetY: { value: 5, unit: "px" },
          blur: { value: 2, unit: "px" },
          spread: { value: 1, unit: "px" },
          color: "#ffffff",
          inset: false,
        },
      ],
    };
    const result = applyTransform(cssShadowTransform, token);

    // @ts-expect-error
    expect(result.$extensions[CSS_EXTENSION].value).toBe(
      "10px 10px 5px 2px #000000 inset, 5px 5px 2px 1px #ffffff",
    );
  });

  it("should handle reference values correctly", () => {
    const token: ShadowToken = {
      $type: "shadow",
      $value: "{reference}",
    };
    const result = applyTransform(cssShadowTransform, token);

    // @ts-expect-error
    expect(result.$extensions[CSS_EXTENSION].value).toBe("{reference}");
  });

  it("should transform resolved values correctly", () => {
    const token: ShadowToken = {
      $type: "shadow",
      $value: {
        offsetX: { value: 10, unit: "px" },
        offsetY: { value: 10, unit: "px" },
        blur: { value: 5, unit: "px" },
        spread: { value: 2, unit: "px" },
        color: "#000000",
        inset: true,
      },
      $extensions: {
        [RESOLVED_EXTENSION]: {
          offsetX: { value: 15, unit: "px" },
          offsetY: { value: 15, unit: "px" },
          blur: { value: 10, unit: "px" },
          spread: { value: 5, unit: "px" },
          color: "#111111",
          inset: false,
        },
      },
    };
    const result = applyTransform(cssShadowTransform, token);

    // @ts-expect-error
    expect(result.$extensions[CSS_EXTENSION].resolvedValue).toBe(
      "15px 15px 10px 5px #111111",
    );
  });
});
