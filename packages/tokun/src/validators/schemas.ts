import {
  hexColorWithAlphaRegex,
  isJsonPointerReferenceObject,
  jsonPointerReferenceRegex,
  TOKEN_TYPES,
  tokenReferenceRegex,
} from "utils/token-utils.js";
import { z } from "zod/v4-mini";
import { Token, TokenType } from "../types/definitions.js";
import { TypeValidators } from "./types.js";

/**
 * Creates a schema for a token.
 *
 * @param type The type of the token.
 * @param value The value of the token.
 * @returns The token schema.
 */
export function createSchema<
  T extends string,
  V extends z.ZodMiniType<any, any>,
>(type: T, value: V) {
  const baseShape = {
    $type: z.optional(z.literal(type)),
    $description: z.optional(z.string()),
    $extensions: z.optional(z.record(z.string(), z.unknown())),
    $deprecated: z.optional(z.union([z.boolean(), z.string()])),
  };

  return z.union([
    z.strictObject({
      ...baseShape,
      $value: z.union([TokenValueReferenceSchema, value]),
    }),
    z.strictObject({
      ...baseShape,
      $ref: JsonPointerReferenceSchema,
    }),
  ]);
}

export const ReferenceValueSchema = z
  .string()
  .check(z.refine((value) => tokenReferenceRegex.test(value)));

export const JsonPointerReferenceSchema = z
  .string()
  .check(z.refine((value) => jsonPointerReferenceRegex.test(value)));

export const JsonPointerReferenceObjectSchema = z.strictObject({
  $ref: JsonPointerReferenceSchema,
});

export const TokenValueReferenceSchema = z.union([
  ReferenceValueSchema,
  JsonPointerReferenceObjectSchema,
]);

export const StrictStringSchema = z
  .string()
  .check(z.refine((value) => !value.includes("{") && !value.includes("}")));

export const GroupSchema = (customTypes?: string[]) =>
  z
    .looseObject({
      $schema: z.optional(z.string()),
      $type: z.optional(
        z
          .string()
          .check(
            z.refine(
              (value) =>
                TOKEN_TYPES.includes(value as TokenType) ||
                (customTypes !== undefined && customTypes.includes(value)),
            ),
          ),
      ),
      $description: z.optional(z.string()),
      $extensions: z.optional(z.record(z.string(), z.unknown())),
      $deprecated: z.optional(z.union([z.boolean(), z.string()])),
      $extends: z.optional(
        z.union([ReferenceValueSchema, JsonPointerReferenceSchema]),
      ),
      $root: z.optional(z.unknown()),
    })
    .check(
      z.refine((value) => {
        const keys = Object.keys(value);

        if (keys.length === 0) {
          return true;
        }

        for (const key of keys) {
          if (
            key.startsWith("$") &&
            key !== "$schema" &&
            key !== "$type" &&
            key !== "$description" &&
            key !== "$extensions" &&
            key !== "$deprecated" &&
            key !== "$extends" &&
            key !== "$root"
          ) {
            return false;
          }
        }

        return true;
      }),
    );

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

const colorSpaceSchema = z
  .string()
  .check(
    z.refine((value: string) =>
      (colorSpaces as readonly string[]).includes(value),
    ),
  );

function validateComponent(
  value: unknown,
  {
    min,
    max,
    exclusiveMax = false,
  }: { min?: number; max?: number; exclusiveMax?: boolean },
) {
  if (value === "none" || isJsonPointerReferenceObject(value)) {
    return true;
  }

  if (typeof value !== "number") {
    return false;
  }

  if (min !== undefined && value < min) {
    return false;
  }

  if (max !== undefined) {
    if (exclusiveMax) {
      if (value >= max) {
        return false;
      }
    } else if (value > max) {
      return false;
    }
  }

  return true;
}

function validateStructuredColorValue(value: {
  colorSpace: unknown;
  components: unknown;
}) {
  if (
    isJsonPointerReferenceObject(value.colorSpace) ||
    isJsonPointerReferenceObject(value.components)
  ) {
    return true;
  }

  if (typeof value.colorSpace !== "string") {
    return false;
  }

  if (!Array.isArray(value.components) || value.components.length !== 3) {
    return false;
  }

  const [first, second, third] = value.components;
  const zeroToOne = (component: unknown) =>
    validateComponent(component, { min: 0, max: 1 });
  const percentage = (component: unknown) =>
    validateComponent(component, { min: 0, max: 100 });
  const hue = (component: unknown) =>
    validateComponent(component, { min: 0, max: 360, exclusiveMax: true });
  const chroma = (component: unknown) =>
    validateComponent(component, { min: 0 });
  const unbounded = (component: unknown) => validateComponent(component, {});

  switch (value.colorSpace) {
    case "srgb":
    case "srgb-linear":
    case "display-p3":
    case "a98-rgb":
    case "prophoto-rgb":
    case "rec2020":
    case "xyz-d65":
    case "xyz-d50":
      return zeroToOne(first) && zeroToOne(second) && zeroToOne(third);
    case "hsl":
    case "hwb":
      return hue(first) && percentage(second) && percentage(third);
    case "lab":
      return percentage(first) && unbounded(second) && unbounded(third);
    case "lch":
      return percentage(first) && chroma(second) && hue(third);
    case "oklab":
      return zeroToOne(first) && unbounded(second) && unbounded(third);
    case "oklch":
      return zeroToOne(first) && chroma(second) && hue(third);
    default:
      return false;
  }
}

export const ColorValueSchema = z
  .strictObject({
    colorSpace: z.union([colorSpaceSchema, JsonPointerReferenceObjectSchema]),
    components: z.union([
      z.array(
        z.union([
          z.number(),
          z.literal("none"),
          JsonPointerReferenceObjectSchema,
        ]),
      ),
      JsonPointerReferenceObjectSchema,
    ]),
    alpha: z.optional(
      z.union([
        z.number().check(z.gte(0), z.lte(1)),
        JsonPointerReferenceObjectSchema,
      ]),
    ),
    hex: z.optional(
      z.union([
        z
          .string()
          .check(z.refine((value) => hexColorWithAlphaRegex.test(value))),
        JsonPointerReferenceObjectSchema,
      ]),
    ),
  })
  .check(z.refine((value) => validateStructuredColorValue(value)));

export const DimensionValueSchema = z.strictObject({
  value: z.union([z.number(), JsonPointerReferenceObjectSchema]),
  unit: z.union([
    z.literal("px"),
    z.literal("rem"),
    JsonPointerReferenceObjectSchema,
  ]),
});

export const FontFamilyValueSchema = z.union([
  StrictStringSchema,
  z
    .array(z.union([StrictStringSchema, JsonPointerReferenceObjectSchema]))
    .check(z.refine((value) => value.length > 0)),
]);

export const FontWeightValueSchema = z.union([
  z.number().check(z.int(), z.gte(1), z.lte(1000)),
  z.string().check(
    z.refine((value) => {
      const keys = Object.values(fontWeightValues);
      return keys.some((key) => key.includes(value));
    }),
  ),
]);

export const DurationValueSchema = z.strictObject({
  value: z.union([z.number(), JsonPointerReferenceObjectSchema]),
  unit: z.union([
    z.literal("ms"),
    z.literal("s"),
    JsonPointerReferenceObjectSchema,
  ]),
});

export const CubicBezierValueSchema = z
  .array(z.union([z.number(), JsonPointerReferenceObjectSchema]))
  .check(
    z.length(4, "The cubic bezier must have 4 values."),
    z.refine((value) => {
      const first = value[0];
      const third = value[2];

      if (
        isJsonPointerReferenceObject(first) ||
        isJsonPointerReferenceObject(third)
      ) {
        return true;
      }

      return (
        typeof first === "number" &&
        typeof third === "number" &&
        first >= 0 &&
        first <= 1 &&
        third >= 0 &&
        third <= 1
      );
    }),
  );

export const NumberValueSchema = z.number().check(
  z.refine((value) => typeof value === "number", {
    message: "The value must be a number.",
  }),
);

export const ColorTokenSchema = createSchema("color", ColorValueSchema);
export const DimensionTokenSchema = createSchema(
  "dimension",
  DimensionValueSchema,
);
export const FontFamilyTokenSchema = createSchema(
  "fontFamily",
  FontFamilyValueSchema,
);
export const FontWeightTokenSchema = createSchema(
  "fontWeight",
  FontWeightValueSchema,
);

/**
 * Helper constant for font weight values.
 * The keys are the font weight values and the values are the possible names.
 * Reference: https://tr.designtokens.org/format/#font-weight
 */
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
};

/**
 * A schema for a duration token.
 * The duration token is an object with a value and a unit.
 * The unit can be "ms" or "s".
 * Reference: https://tr.designtokens.org/format/#duration
 *
 * @returns The duration token schema.
 */
export const DurationTokenSchema = createSchema(
  "duration",
  DurationValueSchema,
);

/**
 * A schema for a cubic bezier token.
 * The cubic bezier token is an array of 4 numbers.
 * The first and third numbers must be between 0 and 1.
 * Reference: https://tr.designtokens.org/format/#cubic-bezier
 *
 * @returns The cubic bezier token schema.
 */
export const CubicBezierTokenSchema = createSchema(
  "cubicBezier",
  CubicBezierValueSchema,
);

/**
 * A schema for a number token.
 * Reference: https://tr.designtokens.org/format/#number
 *
 * @returns The number token schema.
 */
export const NumberTokenSchema = createSchema("number", NumberValueSchema);

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
export const StrokeStyleValueSchema = z.union([
  z
    .string()
    .check(
      z.refine((value: string) =>
        (strokePredefinedValues as readonly string[]).includes(value),
      ),
    ),
  z.strictObject({
    dashArray: z.union([
      z
        .array(z.union([DimensionValueSchema, TokenValueReferenceSchema]))
        .check(z.refine((value) => value.length > 0)),
      JsonPointerReferenceObjectSchema,
    ]),
    lineCap: z.union([
      z
        .string()
        .check(
          z.refine((value: string) =>
            (lineCapPredefinedValues as readonly string[]).includes(value),
          ),
        ),
      JsonPointerReferenceObjectSchema,
    ]),
  }),
]);

export const StrokeStyleTokenSchema = createSchema(
  "strokeStyle",
  StrokeStyleValueSchema,
);
export const strokeStyleTokenPropertyTypes: Record<string, string> = {
  dashArray: "dimension",
  lineCap: "string",
};

const ColorOrReferenceSchema = z.union([
  ColorValueSchema,
  TokenValueReferenceSchema,
]);
const DimensionOrReferenceSchema = z.union([
  DimensionValueSchema,
  TokenValueReferenceSchema,
]);
const DurationOrReferenceSchema = z.union([
  DurationValueSchema,
  TokenValueReferenceSchema,
]);
const NumberOrReferenceSchema = z.union([
  NumberValueSchema,
  TokenValueReferenceSchema,
]);
const FontFamilyOrReferenceSchema = z.union([
  FontFamilyValueSchema,
  TokenValueReferenceSchema,
]);
const FontWeightOrReferenceSchema = z.union([
  FontWeightValueSchema,
  TokenValueReferenceSchema,
]);
const CubicBezierOrReferenceSchema = z.union([
  CubicBezierValueSchema,
  TokenValueReferenceSchema,
]);
const StrokeStyleOrReferenceSchema = z.union([
  StrokeStyleValueSchema,
  TokenValueReferenceSchema,
]);

export const BorderValueSchema = z.strictObject({
  color: ColorOrReferenceSchema,
  width: DimensionOrReferenceSchema,
  style: StrokeStyleOrReferenceSchema,
});

export const BorderTokenSchema = createSchema("border", BorderValueSchema);
export const borderTokenPropertyTypes: Record<string, string> = {
  color: "color",
  width: "dimension",
  style: "strokeStyle",
};

export const TransitionValueSchema = z.strictObject({
  duration: DurationOrReferenceSchema,
  delay: DurationOrReferenceSchema,
  timingFunction: CubicBezierOrReferenceSchema,
});

export const TransitionTokenSchema = createSchema(
  "transition",
  TransitionValueSchema,
);
export const transitionTokenPropertyTypes: Record<string, string> = {
  duration: "duration",
  delay: "duration",
  timingFunction: "cubicBezier",
};

const SingleShadowValueSchema = z.strictObject({
  color: ColorOrReferenceSchema,
  offsetX: DimensionOrReferenceSchema,
  offsetY: DimensionOrReferenceSchema,
  blur: DimensionOrReferenceSchema,
  spread: DimensionOrReferenceSchema,
  inset: z.optional(z.union([z.boolean(), JsonPointerReferenceObjectSchema])),
});

/**
 * A schema for a shadow token.
 * Reference: https://tr.designtokens.org/format/#shadow
 *
 * @returns The shadow token schema.
 */
export const ShadowTokenSchema = createSchema(
  "shadow",
  z.union([
    SingleShadowValueSchema,
    z
      .array(z.union([SingleShadowValueSchema, TokenValueReferenceSchema]))
      .check(z.refine((value) => value.length > 0)),
  ]),
);
export const shadowTokenPropertyTypes: Record<string, string> = {
  color: "color",
  offsetX: "dimension",
  offsetY: "dimension",
  blur: "dimension",
  spread: "dimension",
};

/**
 * A schema for a gradient token.
 * Reference: https://tr.designtokens.org/format/#gradient
 *
 * @returns The gradient token schema.
 */
const GradientStopSchema = z.strictObject({
  color: ColorOrReferenceSchema,
  position: z.union([
    z.number().check(z.gte(0), z.lte(1)),
    TokenValueReferenceSchema,
  ]),
});

export const GradientTokenSchema = createSchema(
  "gradient",
  z
    .array(z.union([GradientStopSchema, TokenValueReferenceSchema]))
    .check(z.refine((value) => value.length > 0)),
);
export const gradientTokenPropertyTypes: Record<string, string> = {
  color: "color",
  position: "number",
};

/**
 * A schema for a typography token.
 * Reference: https://tr.designtokens.org/format/#typography
 *
 * @returns The typography token schema.
 */
export const TypographyTokenSchema = createSchema(
  "typography",
  z.strictObject({
    fontFamily: FontFamilyOrReferenceSchema,
    fontSize: DimensionOrReferenceSchema,
    fontWeight: FontWeightOrReferenceSchema,
    letterSpacing: DimensionOrReferenceSchema,
    lineHeight: NumberOrReferenceSchema,
  }),
);
export const typographyTokenPropertyTypes: Record<string, TokenType> = {
  fontFamily: "fontFamily",
  fontSize: "dimension",
  fontWeight: "fontWeight",
  letterSpacing: "dimension",
  lineHeight: "number",
};

export const dtcgJsonSchemas: TypeValidators = {
  color: {
    validator: (token: Token) => ColorTokenSchema.safeParse(token).success,
  },
  dimension: {
    validator: (token: Token) => DimensionTokenSchema.safeParse(token).success,
  },
  fontFamily: {
    validator: (token: Token) => FontFamilyTokenSchema.safeParse(token).success,
  },
  fontWeight: {
    validator: (token: Token) => FontWeightTokenSchema.safeParse(token).success,
  },
  duration: {
    validator: (token: Token) => DurationTokenSchema.safeParse(token).success,
  },
  cubicBezier: {
    validator: (token: Token) =>
      CubicBezierTokenSchema.safeParse(token).success,
  },
  number: {
    validator: (token: Token) => NumberTokenSchema.safeParse(token).success,
  },
  transition: {
    validator: (token: Token) => TransitionTokenSchema.safeParse(token).success,
  },
  shadow: {
    validator: (token: Token) => ShadowTokenSchema.safeParse(token).success,
  },
  gradient: {
    validator: (token: Token) => GradientTokenSchema.safeParse(token).success,
  },
  typography: {
    validator: (token: Token) => TypographyTokenSchema.safeParse(token).success,
  },
  strokeStyle: {
    validator: (token: Token) =>
      StrokeStyleTokenSchema.safeParse(token).success,
  },
  border: {
    validator: (token: Token) => BorderTokenSchema.safeParse(token).success,
  },
};
