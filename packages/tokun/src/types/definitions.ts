import { ModifyProperties } from "utils/types.js";
import {
  lineCapPredefinedValues,
  strokePredefinedValues,
} from "validators/schemas.js";

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type BaseProperties = {
  $description?: string;
  $extensions?: Record<string, unknown>;
  $deprecated?: boolean | string;
};

export type ReferenceValue = `{${string}}`;
export type JsonPointerReference = `#/${string}`;
export type TokenReference = ReferenceValue;

export type TokenType =
  | "color"
  | "dimension"
  | "fontFamily"
  | "fontWeight"
  | "duration"
  | "cubicBezier"
  | "number"
  | "strokeStyle"
  | "border"
  | "transition"
  | "shadow"
  | "gradient"
  | "typography";

export type ColorSpace =
  | "srgb"
  | "srgb-linear"
  | "hsl"
  | "hwb"
  | "lab"
  | "lch"
  | "oklab"
  | "oklch"
  | "display-p3"
  | "a98-rgb"
  | "prophoto-rgb"
  | "rec2020"
  | "xyz-d65"
  | "xyz-d50";

export type StructuredColor = {
  colorSpace: ColorSpace;
  components: (number | "none")[];
  alpha?: number;
  hex?: string;
};

export type ColorToken = BaseProperties & {
  $type?: "color";
  $value: string | StructuredColor | TokenReference;
};

export type DimensionValue = {
  value: number;
  unit: "px" | "rem";
};

export type DimensionToken = BaseProperties & {
  $type?: "dimension";
  $value: DimensionValue | TokenReference;
};

export type FontFamilyToken = BaseProperties & {
  $type?: "fontFamily";
  $value: string | string[] | TokenReference;
};

export type FontWeightToken = BaseProperties & {
  $type?: "fontWeight";
  $value: string | number | TokenReference;
};

export type DurationValue = {
  value: number;
  unit: "ms" | "s";
};

export type DurationToken = BaseProperties & {
  $type?: "duration";
  $value: DurationValue | TokenReference;
};

export type CubicBezierToken = BaseProperties & {
  $type?: "cubicBezier";
  $value: [number, number, number, number] | TokenReference;
};

export type NumberToken = BaseProperties & {
  $type?: "number";
  $value: number | TokenReference;
};

export type StrokeStyleToken = BaseProperties & {
  $type?: "strokeStyle";
  $value:
    | (typeof strokePredefinedValues)[number]
    | {
        dashArray: (DimensionToken["$value"] | TokenReference)[];
        lineCap: (typeof lineCapPredefinedValues)[number];
      }
    | TokenReference;
};

export type BorderToken = BaseProperties & {
  $type?: "border";
  $value:
    | {
        width: DimensionToken["$value"];
        style: StrokeStyleToken["$value"];
        color: ColorToken["$value"];
      }
    | TokenReference;
};

export type TransitionToken = BaseProperties & {
  $type?: "transition";
  $value:
    | {
        duration: DurationToken["$value"];
        delay: DurationToken["$value"];
        timingFunction: CubicBezierToken["$value"];
      }
    | TokenReference;
};

type ShadowValue =
  | {
      color: ColorToken["$value"];
      offsetX: DimensionToken["$value"];
      offsetY: DimensionToken["$value"];
      blur: DimensionToken["$value"];
      spread: DimensionToken["$value"];
      inset?: boolean;
    }
  | TokenReference;

export type ShadowToken = BaseProperties & {
  $type?: "shadow";
  $value: ShadowValue | (ShadowValue | TokenReference)[] | TokenReference;
};

export type GradientToken = BaseProperties & {
  $type?: "gradient";
  $value:
    | (
        | {
            color: ColorToken["$value"];
            position: NumberToken["$value"];
          }
        | TokenReference
      )[]
    | TokenReference;
};

export type TypographyToken = BaseProperties & {
  $type?: "typography";
  $value:
    | {
        fontFamily: FontFamilyToken["$value"];
        fontSize: DimensionToken["$value"];
        fontWeight: FontWeightToken["$value"];
        letterSpacing: DimensionToken["$value"];
        lineHeight: NumberToken["$value"];
      }
    | TokenReference;
};

export type Token =
  | ColorToken
  | DimensionToken
  | FontFamilyToken
  | FontWeightToken
  | DurationToken
  | CubicBezierToken
  | NumberToken
  | TransitionToken
  | ShadowToken
  | GradientToken
  | TypographyToken
  | StrokeStyleToken
  | BorderToken;

export type StrictToken = WithRequired<Token, "$type">;
export type LooseToken = ModifyProperties<
  Token,
  { $type: string; $value: unknown }
>;

export type TokenValue = Extract<Token, { $value: unknown }>["$value"];
export type TokenCompositeValue = Exclude<
  | TypographyToken["$value"]
  | ShadowToken["$value"]
  | GradientToken["$value"]
  | TransitionToken["$value"]
  | StrokeStyleToken["$value"]
  | BorderToken["$value"],
  TokenReference
>;

export type TokenGroupProperties = {
  $schema?: string;
  $type?: TokenType;
  $description?: string;
  $extensions?: Record<string, unknown>;
  $deprecated?: boolean | string;
  $extends?: ReferenceValue | JsonPointerReference;
};

export type TokenGroup = TokenGroupProperties & {
  [key: string]: Token | TokenGroup | unknown;
};
