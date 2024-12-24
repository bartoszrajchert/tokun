import { TOKEN_TYPES } from "utils/helpers.js";
import { hexColorWithAlphaRegex, tokenReferenceRegex } from "utils/regexes.js";
import { z } from "zod";
import { Token, TokenType } from "../types/definitions.js";
import { TypeValidators } from "./tokens-validator.js";

/**
 * Creates a schema for a token.
 *
 * @param type The type of the token.
 * @param value The value of the token.
 * @returns The token schema.
 */
export function createSchema<T extends string, V extends z.ZodType<any, any>>(
  type: T,
  value: V,
) {
  return z.strictObject({
    $value: z.union([ReferenceValueSchema, value]), // $value is the Token signature
    $type: z.optional(z.literal(type)),
    $description: z.optional(z.string()),
    $extensions: z.optional(z.record(z.unknown())),
  });
}

export const ReferenceValueSchema = z
  .string()
  .refine((value) => tokenReferenceRegex.test(value));

export const StrictStringSchema = z
  .string()
  .refine(
    (value) =>
      tokenReferenceRegex.test(value) ||
      (!value.includes("{") && !value.includes("}")),
  );

export const GroupSchema = (customTypes?: string[]) =>
  z
    .object({
      $type: z.optional(
        z
          .string()
          .refine(
            (value) =>
              TOKEN_TYPES.includes(value as TokenType) ||
              (customTypes !== undefined && customTypes.includes(value)),
          ),
      ),
      $description: z.optional(z.string()),
      $extensions: z.optional(z.record(z.unknown())),
    })
    .passthrough()
    .refine((value) => {
      const keys = Object.keys(value);

      if (keys.length === 0) {
        return true;
      }

      for (const key of keys) {
        if (
          key.startsWith("$") &&
          key !== "$type" &&
          key !== "$description" &&
          key !== "$extensions"
        ) {
          return false;
        }
      }

      return true;
    });

/**
 * A schema for a color token.
 *
 * @example
 * {
 *  $type: "color",
 *  $value: "#000000",
 *  $description: "The primary color of the application."
 * }
 *
 * @returns The color token schema.
 * @link https://tr.designtokens.org/format/#color
 */
export const ColorTokenSchema = createSchema(
  "color",
  z.string().refine((value) => hexColorWithAlphaRegex.test(value)),
);

/**
 * A schema for a dimension token.
 *
 * @example
 * {
 *  $type: "dimension",
 *  $value: "16px",
 *  $description: "The size of the button."
 * }
 *
 * @returns The dimension token schema.
 * @link https://tr.designtokens.org/format/#dimension
 */
export const DimensionTokenSchema = createSchema(
  "dimension",
  z.strictObject({
    value: z.number(),
    unit: z.union([z.literal("px"), z.literal("rem")]),
  }),
);

/**
 * A schema for a font family token.
 *
 * @example
 * {
 *  $type: "fontFamily",
 *  $value: "Arial",
 *  $description: "The primary font family of the application."
 * }
 *
 * @returns The font family token schema.
 * @link https://tr.designtokens.org/format/#fontfamily
 */
export const FontFamilyTokenSchema = createSchema(
  "fontFamily",
  z.union([StrictStringSchema, z.array(StrictStringSchema)]),
);

/**
 * A schema for a font weight token.
 *
 * @example
 * {
 *  $type: "fontWeight",
 *  $value: 400,
 *  $description: "The font weight of the text."
 * }
 *
 * @returns The font weight token schema.
 * @link https://tr.designtokens.org/format/#fontweight
 */
export const FontWeightTokenSchema = createSchema(
  "fontWeight",
  z.union([
    z.number().int().min(1).max(1000),
    z.string().refine((value) => {
      const keys = Object.values(fontWeightValues);
      return keys.some((key) => key.includes(value));
    }),
  ]),
);

/**
 * Helper constant for font weight values.
 * The keys are the font weight values and the values are the possible names.
 *
 * @link https://tr.designtokens.org/format/#font-weight
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
 *
 * @example
 * {
 *  $type: "duration",
 *  $value: "300ms",
 *  $description: "The duration of the animation."
 * }
 *
 * @returns The duration token schema.
 * @link https://tr.designtokens.org/format/#duration
 */
export const DurationTokenSchema = createSchema(
  "duration",
  z.string().refine((value) => value.endsWith("ms"), {
    message: "The duration must be in milliseconds.",
  }),
);

/**
 * A schema for a cubic bezier token.
 * The cubic bezier token is an array of 4 numbers.
 * The first and third numbers must be between 0 and 1.
 *
 * @example
 * {
 *  $type: "cubicBezier",
 *  $value: [0.42, 0, 0.58, 1]
 * }
 *
 * @returns The cubic bezier token schema.
 * @link https://tr.designtokens.org/format/#cubic-bezier
 */
export const CubicBezierTokenSchema = createSchema(
  "cubicBezier",
  z
    .array(z.union([z.number(), ReferenceValueSchema]))
    .length(4, "The cubic bezier must have 4 values.")
    .refine((value) => {
      // Skipping the check if the value is a string
      // because it is previously validated by the ReferenceValueSchema
      if (typeof value[0] === "string" || typeof value[2] === "string") {
        return true;
      }

      return (
        value[0]! >= 0 && value[0]! <= 1 && value[2]! >= 0 && value[2]! <= 1
      );
    }),
);

/**
 * A schema for a number token.
 *
 * @example
 * {
 *  $type: "number",
 *  $value: 16,
 *  $description: "The size of the button."
 * }
 *
 * @returns The number token schema.
 * @link https://tr.designtokens.org/format/#number
 */
export const NumberTokenSchema = createSchema(
  "number",
  z.number().refine((value) => typeof value === "number", {
    message: "The value must be a number.",
  }),
);

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
export const StrokeStyleTokenSchema = createSchema(
  "strokeStyle",
  z.union([
    z.string().refine((value: any) => strokePredefinedValues.includes(value)),
    z.strictObject({
      dashArray: z.array(DimensionTokenSchema.shape.$value),
      lineCap: z
        .string()
        .refine((value: any) => lineCapPredefinedValues.includes(value)),
    }),
  ]),
);

export const BorderTokenSchema = createSchema(
  "border",
  z
    .strictObject({
      color: ColorTokenSchema.shape.$value,
      width: DimensionTokenSchema.shape.$value,
      style: StrokeStyleTokenSchema.shape.$value,
    })
    .refine((value) => typeof value === "object", {
      message:
        "The border value must be an object with the correct properties.",
    }),
);

export const TransitionTokenSchema = createSchema(
  "transition",
  z
    .strictObject({
      duration: DurationTokenSchema.shape.$value,
      delay: DurationTokenSchema.shape.$value,
      timingFunction: CubicBezierTokenSchema.shape.$value,
    })
    .refine((value) => typeof value === "object", {
      message:
        "The transition value must be an object with the correct properties.",
    }),
);

const SingleShadowValueSchema = z
  .strictObject({
    color: ColorTokenSchema.shape.$value,
    offsetX: DimensionTokenSchema.shape.$value,
    offsetY: DimensionTokenSchema.shape.$value,
    blur: DimensionTokenSchema.shape.$value,
    spread: DimensionTokenSchema.shape.$value,
    inset: z.optional(z.boolean()),
  })
  .refine((value) => typeof value === "object", {
    message: "The shadow value must be an object with the correct properties.",
  });

/**
 * A schema for a shadow token.
 *
 * @example
 * {
 *  $type: "shadow",
 *  $value: {
 *    color: "#000000",
 *    offsetX: "0px",
 *    offsetY: "4px",
 *    blur: "8px",
 *    spread: "0px",
 *    inset: false
 *  }
 * }
 *
 * @returns The shadow token schema.
 * @link https://tr.designtokens.org/format/#shadow
 */
export const ShadowTokenSchema = createSchema(
  "shadow",
  z.union([
    SingleShadowValueSchema,
    z.array(z.union([SingleShadowValueSchema, ReferenceValueSchema])),
  ]),
);

/**
 * A schema for a gradient token.
 *
 * Interpretation of `position`:
 *  Specification is not clear about whether the position needs to be between 0 and 1.
 *  Because it says "If a number value outside of that range is given, it MUST be considered as if it were clamped to the range [0, 1]".
 *  So, it is assumed that the position can be any number.
 *  However, it is recommended to use a number between 0 and 1.
 *
 * @example
 * {
 *  $type: "gradient",
 *  $value: [
 *    {
 *      color: "#000000",
 *      position: 0
 *    },
 *    {
 *      color: "#FFFFFF",
 *      position: 1
 *    }
 *  ]
 * }
 *
 * @returns The gradient token schema.
 * @link https://tr.designtokens.org/format/#gradient
 */
export const GradientTokenSchema = createSchema(
  "gradient",
  z.array(
    z.union([
      z.strictObject({
        color: ColorTokenSchema.shape.$value,
        position: NumberTokenSchema.shape.$value,
      }),
      ReferenceValueSchema,
    ]),
  ),
);

/**
 * A schema for a typography token.
 *
 * @example
 * {
 *  $type: "typography",
 *  $value: {
 *    fontFamily: "Arial",
 *    fontSize: "16px",
 *    fontWeight: 400,
 *    letterSpacing: "1px",
 *    lineHeight: 1.5
 *  },
 *  $description: "The typography of the application."
 * }
 *
 * @returns The typography token schema.
 * @link https://tr.designtokens.org/format/#typography
 */
export const TypographyTokenSchema = createSchema(
  "typography",
  z
    .strictObject({
      fontFamily: FontFamilyTokenSchema.shape.$value,
      fontSize: DimensionTokenSchema.shape.$value,
      fontWeight: FontWeightTokenSchema.shape.$value,
      letterSpacing: DimensionTokenSchema.shape.$value,
      lineHeight: NumberTokenSchema.shape.$value,
    })
    .refine((value) => typeof value === "object", {
      message:
        "The typography value must be an object with the correct properties.",
    }),
);

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
};
