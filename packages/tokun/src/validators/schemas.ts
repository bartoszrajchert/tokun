import { TOKEN_TYPES } from "utils/helpers.js";
import { hexColorWithAlphaRegex, tokenReferenceRegex } from "utils/regexes.js";
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
  return z.strictObject({
    $value: z.union([ReferenceValueSchema, value]), // $value is the Token signature
    $type: z.optional(z.literal(type)),
    $description: z.optional(z.string()),
    $extensions: z.optional(z.record(z.string(), z.unknown())),
  });
}

export const ReferenceValueSchema = z
  .string()
  .check(z.refine((value) => tokenReferenceRegex.test(value)));

export const StrictStringSchema = z
  .string()
  .check(
    z.refine(
      (value) =>
        tokenReferenceRegex.test(value) ||
        (!value.includes("{") && !value.includes("}")),
    ),
  );

export const GroupSchema = (customTypes?: string[]) =>
  z
    .looseObject({
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
            key !== "$type" &&
            key !== "$description" &&
            key !== "$extensions"
          ) {
            return false;
          }
        }

        return true;
      }),
    );

/**
 * A schema for a color token.
 * Reference: https://tr.designtokens.org/format/#color
 *
 * @example
 * {
 *  $type: "color",
 *  $value: "#000000",
 *  $description: "The primary color of the application."
 * }
 *
 * @returns The color token schema.
 */
export const ColorTokenSchema = createSchema(
  "color",
  z.string().check(z.refine((value) => hexColorWithAlphaRegex.test(value))),
);

/**
 * A schema for a dimension token.
 * The dimension token is an object with a value and a unit.
 * The unit can be "px" or "rem".
 * Reference: https://tr.designtokens.org/format/#dimension
 *
 * @example
 * {
 *  $type: "dimension",
 *  $value: {
 *    value: 16,
 *    unit: "px"
 *  },
 *  $description: "The size of the button."
 * }
 *
 * @returns The dimension token schema.
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
 * Reference: https://tr.designtokens.org/format/#fontfamily
 *
 * @example
 * {
 *  $type: "fontFamily",
 *  $value: "Arial",
 *  $description: "The primary font family of the application."
 * }
 *
 * @returns The font family token schema.
 */
export const FontFamilyTokenSchema = createSchema(
  "fontFamily",
  z.union([StrictStringSchema, z.array(StrictStringSchema)]),
);

/**
 * A schema for a font weight token.
 * Reference: https://tr.designtokens.org/format/#fontweight
 *
 * @example
 * {
 *  $type: "fontWeight",
 *  $value: 400,
 *  $description: "The font weight of the text."
 * }
 *
 * @returns The font weight token schema.
 */
export const FontWeightTokenSchema = createSchema(
  "fontWeight",
  z.union([
    z.number().check(z.int(), z.gte(1), z.lte(1000)),
    z.string().check(
      z.refine((value) => {
        const keys = Object.values(fontWeightValues);
        return keys.some((key) => key.includes(value));
      }),
    ),
  ]),
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
 * @example
 * {
 *  $type: "duration",
 *  $value: {
 *    value: 300,
 *    unit: "ms"
 *  },
 *  $description: "The duration of the animation."
 * }
 *
 * @returns The duration token schema.
 */
export const DurationTokenSchema = createSchema(
  "duration",
  z.strictObject({
    value: z.number(),
    unit: z.union([z.literal("ms"), z.literal("s")]),
  }),
);

/**
 * A schema for a cubic bezier token.
 * The cubic bezier token is an array of 4 numbers.
 * The first and third numbers must be between 0 and 1.
 * Reference: https://tr.designtokens.org/format/#cubic-bezier
 *
 * @example
 * {
 *  $type: "cubicBezier",
 *  $value: [0.42, 0, 0.58, 1]
 * }
 *
 * @returns The cubic bezier token schema.
 */
export const CubicBezierTokenSchema = createSchema(
  "cubicBezier",
  z.array(z.union([z.number(), ReferenceValueSchema])).check(
    z.length(4, "The cubic bezier must have 4 values."),
    z.refine((value) => {
      // Skipping the check if the value is a string
      // because it is previously validated by the ReferenceValueSchema
      if (typeof value[0] === "string" || typeof value[2] === "string") {
        return true;
      }

      return (
        value[0]! >= 0 && value[0]! <= 1 && value[2]! >= 0 && value[2]! <= 1
      );
    }),
  ),
);

/**
 * A schema for a number token.
 * Reference: https://tr.designtokens.org/format/#number
 *
 * @example
 * {
 *  $type: "number",
 *  $value: 16,
 *  $description: "The size of the button."
 * }
 *
 * @returns The number token schema.
 */
export const NumberTokenSchema = createSchema(
  "number",
  z.number().check(
    z.refine((value) => typeof value === "number", {
      message: "The value must be a number.",
    }),
  ),
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
    z
      .string()
      .check(z.refine((value: any) => strokePredefinedValues.includes(value))),
    z.strictObject({
      dashArray: z.array(DimensionTokenSchema.def.shape.$value),
      lineCap: z
        .string()
        .check(
          z.refine((value: any) => lineCapPredefinedValues.includes(value)),
        ),
    }),
  ]),
);
export const strokeStyleTokenPropertyTypes: Record<string, string> = {
  dashArray: "dimension",
  lineCap: "string", // TODO: for now there is no "string" token type, revisit this later
};

export const BorderTokenSchema = createSchema(
  "border",
  z
    .strictObject({
      color: ColorTokenSchema.def.shape.$value,
      width: DimensionTokenSchema.def.shape.$value,
      style: StrokeStyleTokenSchema.def.shape.$value,
    })
    .check(
      z.refine((value) => typeof value === "object", {
        message:
          "The border value must be an object with the correct properties.",
      }),
    ),
);
export const borderTokenPropertyTypes: Record<string, string> = {
  color: "color",
  width: "dimension",
  style: "strokeStyle",
};

export const TransitionTokenSchema = createSchema(
  "transition",
  z
    .strictObject({
      duration: DurationTokenSchema.def.shape.$value,
      delay: DurationTokenSchema.def.shape.$value,
      timingFunction: CubicBezierTokenSchema.def.shape.$value,
    })
    .check(
      z.refine((value) => typeof value === "object", {
        message:
          "The transition value must be an object with the correct properties.",
      }),
    ),
);
export const transitionTokenPropertyTypes: Record<string, string> = {
  duration: "duration",
  delay: "duration",
  timingFunction: "cubicBezier",
};

const SingleShadowValueSchema = z
  .strictObject({
    color: ColorTokenSchema.def.shape.$value,
    offsetX: DimensionTokenSchema.def.shape.$value,
    offsetY: DimensionTokenSchema.def.shape.$value,
    blur: DimensionTokenSchema.def.shape.$value,
    spread: DimensionTokenSchema.def.shape.$value,
    inset: z.optional(z.boolean()),
  })
  .check(
    z.refine((value) => typeof value === "object", {
      message:
        "The shadow value must be an object with the correct properties.",
    }),
  );

/**
 * A schema for a shadow token.
 * Reference: https://tr.designtokens.org/format/#shadow
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
 */
export const ShadowTokenSchema = createSchema(
  "shadow",
  z.union([
    SingleShadowValueSchema,
    z.array(z.union([SingleShadowValueSchema, ReferenceValueSchema])),
  ]),
);
export const shadowTokenPropertyTypes: Record<string, string> = {
  color: "color",
  offsetX: "dimension",
  offsetY: "dimension",
  blur: "dimension",
  spread: "dimension",
  inset: "boolean",
};

/**
 * A schema for a gradient token.
 *
 * Interpretation of `position`:
 *  Specification is not clear about whether the position needs to be between 0 and 1.
 *  Because it says "If a number value outside of that range is given, it MUST be considered as if it were clamped to the range [0, 1]".
 *  So, it is assumed that the position can be any number.
 *  However, it is recommended to use a number between 0 and 1.
 * Reference: https://tr.designtokens.org/format/#gradient
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
 */
export const GradientTokenSchema = createSchema(
  "gradient",
  z.array(
    z.union([
      z.strictObject({
        color: ColorTokenSchema.def.shape.$value,
        position: NumberTokenSchema.def.shape.$value,
      }),
      ReferenceValueSchema,
    ]),
  ),
);
export const gradientTokenPropertyTypes: Record<string, string> = {
  color: "color",
  position: "number",
};

/**
 * A schema for a typography token.
 * Reference: https://tr.designtokens.org/format/#typography
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
 */
export const TypographyTokenSchema = createSchema(
  "typography",
  z
    .strictObject({
      fontFamily: FontFamilyTokenSchema.def.shape.$value,
      fontSize: DimensionTokenSchema.def.shape.$value,
      fontWeight: FontWeightTokenSchema.def.shape.$value,
      letterSpacing: DimensionTokenSchema.def.shape.$value,
      lineHeight: NumberTokenSchema.def.shape.$value,
    })
    .check(
      z.refine((value) => typeof value === "object", {
        message:
          "The typography value must be an object with the correct properties.",
      }),
    ),
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
};
