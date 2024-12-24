import { pascalCaseTransform } from "builder/transforms/pascal-case-transform.js";
import { applyTransform } from "utils/helpers.js";
import { describe, expect, it } from "vitest";

describe("Test pascal-case-transform", () => {
  it.each(["brand-color-core", "brand_color_core", "brand.color.core"])(
    "test pacalCaseTransform %s",
    (input) => {
      const expected = "BrandColorCore";

      expect(applyTransform(pascalCaseTransform, input)).toBe(expected);
    },
  );

  it("test pacalCaseTransform brandColorCore", () => {
    const expected = "Brandcolorcore";

    expect(applyTransform(pascalCaseTransform, "brandColorCore")).toBe(
      expected,
    );
  });
});
