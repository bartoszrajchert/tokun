import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { cssGradientTransform } from "builder/transforms/css/css-gradient-transform.js";
import { GradientToken, Token } from "types/definitions.js";
import { applyTransform } from "utils/helpers.js";
import { RESOLVED_EXTENSION } from "utils/to-flat.js";
import { describe, expect, it } from "vitest";

describe("cssGradientTransform", () => {
  it("should return the token unchanged if $type is not 'gradient'", () => {
    const token: Token = { $type: "color", $value: "#000000" };
    const result = applyTransform(cssGradientTransform, token);
    expect(result).toEqual(token);
  });

  it("should transform a gradient token with direct values", () => {
    const token: GradientToken = {
      $type: "gradient",
      $value: [
        { color: "#ff0000", position: 0 },
        { color: "#00ff00", position: 0.5 },
        { color: "#0000ff", position: 1 },
      ],
    };
    const result = applyTransform(cssGradientTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]?.value).toBe(
      "linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
    );
  });

  it("should transform a gradient token with reference values", () => {
    const token: GradientToken = {
      $type: "gradient",
      $value: "{gradientReference}",
    };
    const result = applyTransform(cssGradientTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]?.value).toBe(
      "{gradientReference}",
    );
  });

  it("should transform a gradient token with resolved values", () => {
    const token: GradientToken = {
      $type: "gradient",
      $value: [
        { color: "#ff0000", position: 0 },
        { color: "#00ff00", position: 0.5 },
        { color: "#0000ff", position: 1 },
      ],
      $extensions: {
        [RESOLVED_EXTENSION]: [
          { color: "#ff0000", position: 0 },
          { color: "#00ff00", position: 0.5 },
          { color: "#0000ff", position: 1 },
        ],
      },
    };
    const result = applyTransform(cssGradientTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]?.resolvedValue).toBe(
      "linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
    );
  });

  it("should handle tokens without $extensions", () => {
    const token: GradientToken = {
      $type: "gradient",
      $value: [
        { color: "#ff0000", position: 0 },
        { color: "#00ff00", position: 0.5 },
        { color: "#0000ff", position: 1 },
      ],
    };
    const result = applyTransform(cssGradientTransform, token);

    // @ts-expect-error
    expect(result.$extensions?.[CSS_EXTENSION]?.value).toBe(
      "linear-gradient(90deg, #ff0000 0%, #00ff00 50%, #0000ff 100%)",
    );
  });
});
