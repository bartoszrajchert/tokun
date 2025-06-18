import { cssVariableSafeTransform } from "builder/transforms/css/css-variable-safe-transform.js";
import { applyTransform } from "utils/token-utils.js";
import { describe, expect, it } from "vitest";

describe("cssVariableSafeTransform", () => {
  it("should remove special characters from the string", () => {
    const input = "var(--my-variable@name!)";
    const expectedOutput = "var--my-variablename";
    expect(applyTransform(cssVariableSafeTransform, input)).toBe(
      expectedOutput,
    );
  });

  it("should retain alphanumeric characters, hyphens, and underscores", () => {
    const input = "valid-variable_name-123";
    const expectedOutput = "valid-variable_name-123";
    expect(applyTransform(cssVariableSafeTransform, input)).toBe(
      expectedOutput,
    );
  });

  it("should handle empty strings", () => {
    const input = "";
    const expectedOutput = "";
    expect(applyTransform(cssVariableSafeTransform, input)).toBe(
      expectedOutput,
    );
  });

  it("should handle strings with only special characters", () => {
    const input = "@#$%^&*()";
    const expectedOutput = "";
    expect(applyTransform(cssVariableSafeTransform, input)).toBe(
      expectedOutput,
    );
  });
});
