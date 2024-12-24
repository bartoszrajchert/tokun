import { CSS_EXTENSION } from "builder/formats/css-format.js";
import { cssBorderStyleTransform } from "builder/transforms/css/css-border-style-transform.js";
import { Token } from "types/definitions.js";
import { applyTransform } from "utils/helpers.js";
import { RESOLVED_EXTENSION } from "utils/to-flat.js";
import { describe, expect, it } from "vitest";

describe("cssBorderTransform", () => {
  it("should return the token unchanged if $type is not 'border'", () => {
    const token: Token = { $type: "color", $value: "#000000" };
    const result = applyTransform(cssBorderStyleTransform, token);
    expect(result).toEqual(token);
  });

  describe("strokeStyle", () => {
    it("should transform strokeStyle token without reference", () => {
      const token: Token = {
        $type: "strokeStyle",
        $value: "dashed",
      };
      const result = applyTransform(cssBorderStyleTransform, token);

      // @ts-expect-error
      expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
        value: "dashed",
      });
    });

    it("should transform strokeStyle token with reference", () => {
      const token: Token = {
        $type: "strokeStyle",
        $value: "{reference}",
      };
      const result = applyTransform(cssBorderStyleTransform, token);

      // @ts-expect-error
      expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
        value: "{reference}",
      });
    });

    it("should transform strokeStyle to fallback value (dashed) if complex object", () => {
      const token: Token = {
        $type: "strokeStyle",
        $value: {
          dashArray: [
            { value: 10, unit: "px" },
            { value: 5, unit: "px" },
          ],
          lineCap: "round",
        },
      };
      const result = applyTransform(cssBorderStyleTransform, token);

      // @ts-expect-error
      expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
        value: "dashed",
      });
    });

    it("should transform strokeStyle token with resolved value", () => {
      const token: Token = {
        $type: "strokeStyle",
        $value: "{style}",
        $extensions: {
          [RESOLVED_EXTENSION]: "solid",
        },
      };
      const result = applyTransform(cssBorderStyleTransform, token);

      // @ts-expect-error
      expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
        resolvedValue: "solid",
        value: "{style}",
      });
    });

    it("should transform strokeStyle token with resolved value (complex object)", () => {
      const token: Token = {
        $type: "strokeStyle",
        $value: "{style}",
        $extensions: {
          [RESOLVED_EXTENSION]: {
            dashArray: [
              { value: 10, unit: "px" },
              { value: 5, unit: "px" },
            ],
            lineCap: "round",
          },
        },
      };
      const result = applyTransform(cssBorderStyleTransform, token);

      // @ts-expect-error
      expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
        resolvedValue: "dashed",
        value: "{style}",
      });
    });
  });

  describe("border", () => {
    it("should transform border token without reference", () => {
      const token: Token = {
        $type: "border",
        $value: {
          color: "#000000",
          width: {
            value: 1,
            unit: "px",
          },
          style: "solid",
        },
      };
      const result = applyTransform(cssBorderStyleTransform, token);

      // @ts-expect-error
      expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
        value: "1px solid #000000",
      });
    });

    it("should transform border token with reference", () => {
      const token: Token = {
        $type: "border",
        $value: "{reference}",
      };
      const result = applyTransform(cssBorderStyleTransform, token);

      // @ts-expect-error
      expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
        value: "{reference}",
      });
    });

    it("should transform border token with resolved value", () => {
      const token: Token = {
        $type: "border",
        $value: {
          color: "{color}",
          width: "{width}",
          style: "{style}",
        },
        $extensions: {
          [RESOLVED_EXTENSION]: {
            color: "#FFFFFF",
            width: {
              value: 2,
              unit: "px",
            },
            style: "dashed",
          },
        },
      };
      const result = applyTransform(cssBorderStyleTransform, token);

      // @ts-expect-error
      expect(result.$extensions?.[CSS_EXTENSION]).toEqual({
        resolvedValue: "2px dashed #FFFFFF",
        value: "{width} {style} {color}",
      });
    });
  });
});
