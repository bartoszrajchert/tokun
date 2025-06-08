import { snakeCaseTransform } from "builder/transforms/snake-case-transform.js";
import { applyTransform } from "utils/token-utils.js";
import { describe, expect, it } from "vitest";

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
