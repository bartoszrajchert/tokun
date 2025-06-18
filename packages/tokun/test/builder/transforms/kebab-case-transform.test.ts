import { kebabCaseTransform } from "builder/transforms/kebab-case-transform.js";
import { applyTransform } from "utils/token-utils.js";
import { describe, expect, it } from "vitest";

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
