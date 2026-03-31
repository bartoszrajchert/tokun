export const tokenTypes = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "duration",
  "cubicBezier",
  "number",
  "strokeStyle",
  "border",
  "transition",
  "shadow",
  "gradient",
  "typography",
] as const;

export const colorSpaces = [
  "srgb",
  "srgb-linear",
  "hsl",
  "hwb",
  "lab",
  "lch",
  "oklab",
  "oklch",
  "display-p3",
  "a98-rgb",
  "prophoto-rgb",
  "rec2020",
  "xyz-d65",
  "xyz-d50",
] as const;

export const strokePredefinedValues = [
  "solid",
  "dashed",
  "dotted",
  "double",
  "groove",
  "ridge",
  "outset",
  "inset",
] as const;

export const lineCapPredefinedValues = ["butt", "round", "square"] as const;

export const fontWeightValues = {
  100: ["thin", "hairline"],
  200: ["extra-light", "ultra-light"],
  300: ["light"],
  400: ["normal", "regular", "book"],
  500: ["medium"],
  600: ["semi-bold", "demi-bold"],
  700: ["bold"],
  800: ["extra-bold", "ultra-bold"],
  900: ["black", "heavy"],
  950: ["extra-black", "ultra-black"],
} as const;
