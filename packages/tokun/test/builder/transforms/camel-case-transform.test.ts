import { camelCaseTransform } from "builder/transforms/camel-case-transform.js";
import { applyTransform } from "utils/helpers.js";
import { describe, expect, it } from "vitest";

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
