import {
  BorderTokenSchema,
  ColorTokenSchema,
  CubicBezierTokenSchema,
  DimensionTokenSchema,
  DurationTokenSchema,
  FontFamilyTokenSchema,
  FontWeightTokenSchema,
  GradientTokenSchema,
  NumberTokenSchema,
  ShadowTokenSchema,
  StrokeStyleTokenSchema,
  TransitionTokenSchema,
  TypographyTokenSchema,
} from "validators/schemas.js";
import { describe, expect, it } from "vitest";

const structuredBlack = {
  colorSpace: "srgb",
  components: [0, 0, 0],
} as const;

const structuredWhite = {
  colorSpace: "srgb",
  components: [1, 1, 1],
} as const;

describe("Test schema single token", () => {
  it.each(["{color.unknown}"])(`test color token (reference) %s`, (color) => {
    const res = {
      $type: "color",
      $value: color,
      $description: "The primary color of the application.",
    };

    expect(() => ColorTokenSchema.parse(res)).not.toThrowError();
  });

  // Color token tests - structured color format (DTCG 2025.10)
  it.each([
    { colorSpace: "srgb", components: [1, 0, 0] },
    { colorSpace: "srgb", components: [1, 0, 0], alpha: 0.5 },
    { colorSpace: "display-p3", components: [1, 0.5, 0] },
    { colorSpace: "oklch", components: [0.7, 0.15, 30], hex: "#ff0000" },
    { colorSpace: "hsl", components: [120, 50, 50] },
    { colorSpace: "lab", components: [50, "none", 30] },
  ])(`test color token (structured) %s`, (color) => {
    const res = {
      $type: "color",
      $value: color,
    };

    expect(() => ColorTokenSchema.parse(res)).not.toThrowError();
  });

  it.each([
    123456,
    "#000000",
    "#000",
    "#000000ff",
    "#000f",
    "{color.unknown",
    "000000",
    "000",
    "000000ff",
    "000f",
  ])("test invalid color token %s", (color) => {
    const res = {
      $type: "color",
      $value: color,
      $description: "The primary color of the application.",
    };

    expect(() => ColorTokenSchema.parse(res)).toThrowError();
  });

  it.each([
    { colorSpace: "invalid-space", components: [1, 0, 0] },
    { colorSpace: "srgb", components: [1, 0, 0], alpha: 2 },
    { colorSpace: "srgb", components: [1, 0, 0], hex: "invalid" },
  ])("test invalid structured color token %s", (color) => {
    const res = {
      $type: "color",
      $value: color,
    };

    expect(() => ColorTokenSchema.parse(res)).toThrowError();
  });

  it.each([
    {
      value: 16,
      unit: "px",
    },
    {
      value: 16,
      unit: "rem",
    },
    "{dimension.unknown}",
  ])(`test dimension token %s`, (dimension) => {
    const res = {
      $type: "dimension",
      $value: dimension,
      $description: "The size of the button.",
    };

    expect(() => DimensionTokenSchema.parse(res)).not.toThrowError();
  });

  it.each([
    16,
    "16",
    "16px ",
    "16rem ",
    "{dimension.unknown",
    {
      value: "16",
      unit: "px",
    },
    {
      value: 16,
      unit: "unknown",
    },
    {
      value: 16,
      unit: "px",
      invalid: "invalid",
    },
  ])(`test invalid dimension token %s`, (dimension) => {
    const res = {
      $type: "dimension",
      $value: dimension,
      $description: "The size of the button.",
    };

    expect(() => DimensionTokenSchema.parse(res)).toThrowError();
  });

  it.each(["Arial", "{fontFamily.unknown}", ["Arial", "sans-serif"]])(
    "test font family token %s",
    (fontFamily) => {
      const res = {
        $type: "fontFamily",
        $value: fontFamily,
        $description: "The primary font family of the application.",
      };

      expect(() => FontFamilyTokenSchema.parse(res)).not.toThrowError();
    },
  );

  it.each([
    16,
    "{fontFamily.unknown",
    ["{fontFamily.unknown"],
    ["{fontFamily.unknown}", "sans-serif"],
  ])("test invalid font family token %s", (fontFamily) => {
    const res = {
      $type: "fontFamily",
      $value: fontFamily,
      $description: "The primary font family of the application.",
    };

    expect(() => FontFamilyTokenSchema.parse(res)).toThrowError();
  });

  it.each([
    "thin",
    "hairline",
    "extra-light",
    "ultra-light",
    "light",
    "normal",
    "regular",
    "book",
    "medium",
    "semi-bold",
    "demi-bold",
    "bold",
    "extra-bold",
    "ultra-bold",
    "black",
    "heavy",
    "extra-black",
    "ultra-black",
    100,
    200,
    300,
    400,
    500,
    600,
    700,
    800,
    900,
    "{fontWeight.unknown}",
  ])("test font weight token %s", (fontWeight) => {
    const res = {
      $type: "fontWeight",
      $value: fontWeight,
      $description: "The primary font weight of the application.",
    };

    expect(() => FontWeightTokenSchema.parse(res)).not.toThrowError();
  });

  it.each([
    "thin ",
    "normally",
    "boldly",
    "bolder",
    "lighter",
    "100",
    "900",
    0,
    1001,
    1100,
    -100,
    NaN,
    true,
    false,
    "{fontWeight.unknown",
  ])("test invalid font weight token %s", (fontWeight) => {
    const res = {
      $type: "fontWeight",
      $value: fontWeight,
      $description: "The primary font weight of the application.",
    };

    expect(() => FontWeightTokenSchema.parse(res)).toThrowError();
  });

  it.each([
    { value: 12, unit: "ms" },
    { value: 12, unit: "s" },
    "{duration.unknown}",
  ])("test duration token %s", (duration) => {
    const res = {
      $type: "duration",
      $value: duration,
      $description: "The duration of the animation.",
    };

    expect(() => DurationTokenSchema.parse(res)).not.toThrowError();
  });

  it.each(["12", "12s", "12m", "12h", "12d", "12ms ", "{duration.unknown"])(
    "test invalid duration token %s",
    (duration) => {
      const res = {
        $type: "duration",
        $value: duration,
        $description: "The duration of the animation.",
      };

      expect(() => DurationTokenSchema.parse(res)).toThrowError();
    },
  );

  it.for([
    [0.1, 0.2, 0.3, 0.4],
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0.5, 0.5, 0.5, 0.5],
    [{ $ref: "#/curve/p1x" }, 0.2, { $ref: "#/curve/p2x" }, 0.4],
    "{cubicBezier.unknown}",
  ])("test cubic bezier token %s", (cubicBezier) => {
    const res = {
      $type: "cubicBezier",
      $value: cubicBezier,
      $description: "The cubic bezier of the animation.",
    };

    expect(() => CubicBezierTokenSchema.parse(res)).not.toThrowError();
  });

  it.for([
    [0.1, 0.2, 0.3, 0.4, 0.5],
    [0, 0, 2, 0],
    [2, 0, 0, 0],
    [1, 1, 1, 1, 1],
    [0.5, 0.5, 0.5, 0.5, 0.5],
    [0.5, 0.5, 0.5],
    [0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5],
    ["0.5", "0.5", "0.5", "0.5"],
    ["{cubicBezier.unknown", 0.5, 0.5, 0.5],
    "{cubicBezier.unknown",
  ])("test invalid cubic bezier token %s", (cubicBezier) => {
    const res = {
      $type: "cubicBezier",
      $value: cubicBezier,
      $description: "The cubic bezier of the animation.",
    };

    expect(() => CubicBezierTokenSchema.parse(res)).toThrowError();
  });

  it.each(["{number.unknown}", 16, 16.12])("test number token %s", (number) => {
    const res = {
      $type: "number",
      $value: number,
      $description: "The size of the button.",
    };

    expect(() => NumberTokenSchema.parse(res)).not.toThrowError();
  });

  it.each(["{number.unknown", "16 ", "16.12.12", "16.12.12"])(
    "test invalid number token %s",
    (number) => {
      const res = {
        $type: "number",
        $value: number,
        $description: "The size of the button.",
      };

      expect(() => NumberTokenSchema.parse(res)).toThrowError();
    },
  );

  it.each([
    "solid",
    "dashed",
    "dotted",
    "double",
    "groove",
    "ridge",
    "outset",
    "inset",
    {
      dashArray: [
        { value: 1, unit: "px" },
        { value: 2, unit: "px" },
      ],
      lineCap: "butt",
    },
    {
      dashArray: [
        { value: 1, unit: "px" },
        { value: 2, unit: "px" },
      ],
      lineCap: "round",
    },
    {
      dashArray: [
        { value: 1, unit: "px" },
        { value: 2, unit: "px" },
      ],
      lineCap: "square",
    },
    {
      dashArray: ["{dash.1}", { value: 2, unit: "px" }],
      lineCap: "square",
    },
    "{strokeStyle.unknown}",
  ])(`test stroke style token %s`, (strokeStyle) => {
    const res = {
      $type: "strokeStyle",
      $value: strokeStyle,
      $description: "The stroke style of the element.",
    };

    expect(() => StrokeStyleTokenSchema.parse(res)).not.toThrowError();
  });

  it.each([
    "solid ",
    "none",
    "hidden",
    {
      dashArray: [
        { value: 1, unit: "px" },
        { value: 2, unit: "px" },
      ],
      lineCap: "unknown",
    },
    {
      dashArray: [
        { value: 1, unit: "px" },
        { value: 2, unit: "px" },
      ],
      lineCap: "round ",
    },
    {
      dashArray: [
        { value: 1, unit: "px" },
        { value: 2, unit: "px" },
      ],
      lineCap: "square",
      unknown: "unknown",
    },
    {
      dashArray: [
        { value: 1, unit: "px" },
        { value: 2, unit: "px" },
      ],
      lineCap: "butt",
      lineJoin: "round",
    },
    {
      dashArray: [
        { value: 1, unit: "px" },
        { value: 2, unit: "px" },
      ],
      lineCap: "butt",
      lineJoin: "miter",
      lineWidth: { value: 2, unit: "px" },
    },
    "{strokeStyle.unknown",
  ])(`test invalid stroke style token %s`, (strokeStyle) => {
    const res = {
      $type: "strokeStyle",
      $value: strokeStyle,
      $description: "The stroke style of the element.",
    };

    expect(() => StrokeStyleTokenSchema.parse(res)).toThrowError();
  });
  it.each([
    {
      color: structuredBlack,
      width: { value: 1, unit: "px" },
      style: "solid",
    },
    {
      color: "{color.unknown}",
      width: { value: 1, unit: "px" },
      style: "solid",
    },
    {
      color: structuredBlack,
      width: "{dimension.unknown}",
      style: "solid",
    },
    {
      color: structuredBlack,
      width: { value: 1, unit: "px" },
      style: "{strokeStyle.unknown}",
    },
  ])("test border token %s", (border) => {
    const res = {
      $type: "border",
      $value: border,
      $description: "The border of the element.",
    };

    expect(() => BorderTokenSchema.parse(res)).not.toThrowError();
  });

  it.each([
    {
      color: structuredBlack,
      width: { value: 1, unit: "px" },
      style: "solid",
      extra: "extra",
    },
  ])("test invalid border token %s", (border) => {
    const res = {
      $type: "border",
      $value: border,
      $description: "The border of the element.",
    };

    expect(() => BorderTokenSchema.parse(res)).toThrowError();
  });

  it.each([
    {
      duration: {
        value: 12,
        unit: "ms",
      },
      timingFunction: [0.1, 0.2, 0.3, 0.4],
      delay: {
        value: 12,
        unit: "ms",
      },
    },
    {
      duration: "{duration.unkown}",
      timingFunction: "{timingFunction.unkown}",
      delay: "{delay.unkown}",
    },
  ])("test transition token %s", (transition) => {
    const res = {
      $type: "transition",
      $value: transition,
      $description: "The transition of the animation.",
    };

    expect(() => TransitionTokenSchema.parse(res)).not.toThrowError();
  });

  it.each([
    {
      duration: "12ms",
      timingFunction: [0.1, 0.2, 0.3, 0.4],
      delay: "12ms",
      extra: "extra",
    },
    {
      duration: "12ms",
      timingFunction: [0.1, 0.2, 0.3, 0.4],
      delay: "{delay.unkown",
    },
  ])("test invalid transition token %s", (transition) => {
    const res = {
      $type: "transition",
      $value: transition,
      $description: "The transition of the animation.",
    };

    expect(() => TransitionTokenSchema.parse(res)).toThrowError();
  });

  // Shadow tokens
  it.for([
    {
      color: structuredBlack,
      offsetX: { value: 0, unit: "px" },
      offsetY: { value: 4, unit: "px" },
      blur: { value: 8, unit: "px" },
      spread: { value: 0, unit: "px" },
    },
    {
      color: "{color.unknown}",
      offsetX: { value: 0, unit: "px" },
      offsetY: { value: 4, unit: "px" },
      blur: { value: 8, unit: "px" },
      spread: { value: 0, unit: "px" },
      inset: false,
    },
    [
      {
        color: structuredBlack,
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 4, unit: "px" },
        blur: { value: 8, unit: "px" },
        spread: { value: 0, unit: "px" },
      },
      {
        color: "{color.unknown}",
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 4, unit: "px" },
        blur: { value: 8, unit: "px" },
        spread: { value: 0, unit: "px" },
      },
    ],
    [
      "{shadow.unknown}",
      {
        color: structuredBlack,
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 4, unit: "px" },
        blur: { value: 8, unit: "px" },
        spread: { value: 0, unit: "px" },
      },
    ],
  ])("test shadow token %s", (shadow) => {
    const res = {
      $type: "shadow",
      $value: shadow,
      $description: "The shadow of the element.",
    };

    expect(() => ShadowTokenSchema.parse(res)).not.toThrowError();
  });

  it.for([
    {
      color: structuredBlack,
      offsetX: { value: 0, unit: "px" },
      offsetY: { value: 4, unit: "px" },
      blur: { value: 8, unit: "px" },
      spread: { value: 0, unit: "px" },
      inset: "false",
    },
    {
      color: structuredBlack,
      offsetX: { value: 0, unit: "px" },
      offsetY: { value: 4, unit: "px" },
      blur: { value: 8, unit: "px" },
      spread: { value: 0, unit: "px" },
      extra: "extra",
    },
    [
      "{shadow.unknown",
      {
        color: structuredBlack,
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 4, unit: "px" },
        blur: { value: 8, unit: "px" },
        spread: { value: 0, unit: "px" },
      },
    ],
  ])("test invalid shadow token %s", (shadow) => {
    const res = {
      $type: "shadow",
      $value: shadow,
      $description: "The shadow of the element. ",
    };

    expect(() => ShadowTokenSchema.parse(res)).toThrowError();
  });

  it.for([
    [
      { color: structuredBlack, position: 0 },
      { color: structuredWhite, position: 1 },
    ],
    [
      { color: "{color.unknown}", position: 0 },
      { color: structuredWhite, position: 1 },
    ],
    [
      { color: structuredBlack, position: 0 },
      { color: "{color.unknown}", position: 1 },
    ],
    [
      { color: "{color.unknown}", position: 0 },
      { color: "{color.unknown}", position: 1 },
    ],
    ["{gradient.unknown}", { color: structuredWhite, position: 1 }],
  ])("test gradient token %s", (gradient) => {
    const res = {
      $type: "gradient",
      $value: gradient,
      $description: "The gradient of the element.",
    };

    expect(() => GradientTokenSchema.parse(res)).not.toThrowError();
  });

  it.for([
    ["{color.unknown"],
    [
      { color: structuredBlack, position: 0 },
      { color: structuredWhite, position: 1, unknown: "unknown" },
    ],
    [{ color: structuredBlack, position: 2 }],
    ,
  ])("test invalid gradient token %s", (gradient) => {
    const res = {
      $type: "gradient",
      $value: gradient,
      $description: "The gradient of the element.",
    };

    expect(() => GradientTokenSchema.parse(res)).toThrowError();
  });

  // Typography tokens - DTCG 2025.10: letterSpacing and lineHeight optional, new props
  it.for([
    {
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: {
        value: 16,
        unit: "px",
      },
      lineHeight: 1,
      letterSpacing: {
        value: 0.5,
        unit: "px",
      },
    },
    {
      fontFamily: "{fontFamily.unknown}",
      fontWeight: "bold",
      fontSize: {
        value: 16,
        unit: "px",
      },
      lineHeight: 1.2,
      letterSpacing: {
        value: 0.5,
        unit: "px",
      },
    },
    {
      fontFamily: "Arial",
      fontWeight: "{fontWeight.unknown}",
      fontSize: {
        value: 16,
        unit: "px",
      },
      lineHeight: 1.2,
      letterSpacing: {
        value: 0.5,
        unit: "px",
      },
    },
    {
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: "{dimension.unknown}",
      lineHeight: 1.2,
      letterSpacing: {
        value: 0.5,
        unit: "px",
      },
    },
    {
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: {
        value: 16,
        unit: "px",
      },
      lineHeight: "{dimension.unknown}",
      letterSpacing: {
        value: 0.5,
        unit: "px",
      },
    },
    {
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: {
        value: 16,
        unit: "px",
      },
      lineHeight: 1.2,
      letterSpacing: "{dimension.unknown}",
    },
    "{typography.unknown}",
  ])("test typography token %s", (typography) => {
    const res = {
      $type: "typography",
      $value: typography,
      $description: "The typography of the element.",
    };

    expect(() => TypographyTokenSchema.parse(res)).not.toThrowError();
  });

  it.for([
    {
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: "16px",
      lineHeight: 1,
      letterSpacing: "0.5px",
    },
    {
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: {
        value: 16,
        unit: "px",
      },
    },
    "{typography.unknown",
    {
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: {
        value: 16,
        unit: "px",
      },
      lineHeight: 1.2,
      letterSpacing: {
        value: 0.5,
        unit: "px",
      },
      extra: "extra",
    },
    // Invalid new property values
    {
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: { value: 16, unit: "px" },
      fontStyle: "oblique",
    },
    {
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: { value: 16, unit: "px" },
      textCase: "none",
    },
  ])("test invalid typography token %s", (typography) => {
    const res = {
      $type: "typography",
      $value: typography,
      $description: "The typography of the element.",
    };

    expect(() => TypographyTokenSchema.parse(res)).toThrowError();
  });

  // $deprecated property support
  it("should accept $deprecated as boolean", () => {
    const res = {
      $type: "color",
      $value: structuredBlack,
      $deprecated: true,
    };
    expect(() => ColorTokenSchema.parse(res)).not.toThrowError();
  });

  it("should accept $deprecated as string", () => {
    const res = {
      $type: "color",
      $value: structuredBlack,
      $deprecated: "Use brand.primary instead",
    };
    expect(() => ColorTokenSchema.parse(res)).not.toThrowError();
  });
});
