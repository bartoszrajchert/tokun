import {
  camelCaseTransform,
  kebabCaseTransform,
  pascalCaseTransform,
  snakeCaseTransform,
} from "builder/transforms/name-transforms.js";
import { applyTransform } from "utils/token-utils.js";
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

describe("Test snake-case-transform", () => {
  it.each([
    "brandColorCore",
    "brand-color-core",
    "brand_color_core",
    "brand.color.core",
  ])("test snakeCaseTransform %s", (input) => {
    const expected = "brand_color_core";

    expect(applyTransform(snakeCaseTransform, input)).toBe(expected);
  });
});

describe("Test kebab-case-transform", () => {
  it.each([
    "brandColorCore",
    "brand-color-core",
    "brand_color_core",
    "brand.color.core",
  ])("test kebabCaseTransform %s", (input) => {
    const expected = "brand-color-core";

    expect(applyTransform(kebabCaseTransform, input)).toBe(expected);
  });
});

describe("Test camel-case-transform", () => {
  it.each([
    "brandColorCore",
    "brand-color-core",
    "brand_color_core",
    "brand.color.core",
  ])("test camelCaseTransform %s", (input) => {
    const expected = "brandColorCore";

    expect(applyTransform(camelCaseTransform, input)).toBe(expected);
  });
});
