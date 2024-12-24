import { ModifyProperties } from "utils/types.js";
import {
  lineCapPredefinedValues,
  strokePredefinedValues,
} from "validators/schemas.js";

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };

export type BaseProperties = {
  $description?: string;
  $extensions?: Record<string, any>;
};

export type ReferenceValue = `{${string}}`;

export type ColorToken = BaseProperties & {
  $type?: "color";
  $value: `#${string}` | ReferenceValue;
};

export type DimensionToken = BaseProperties & {
  $type?: "dimension";
  $value:
    | {
        value: number;
        unit: "px" | "rem";
      }
    | ReferenceValue;
};

export type FontFamilyToken = BaseProperties & {
  $type?: "fontFamily";
  $value: string | (string | ReferenceValue)[] | ReferenceValue;
};

export type FontWeightToken = BaseProperties & {
  $type?: "fontWeight";
  $value: string | number | ReferenceValue;
};

export type DurationToken = BaseProperties & {
  $type?: "duration";
  $value: `${number}ms` | ReferenceValue;
};

export type CubicBezierToken = BaseProperties & {
  $type?: "cubicBezier";
  $value:
    | [
        number | ReferenceValue,
        number | ReferenceValue,
        number | ReferenceValue,
        number | ReferenceValue,
      ]
    | ReferenceValue;
};

export type NumberToken = BaseProperties & {
  $type?: "number";
  $value: number | ReferenceValue;
};

export type StrokeStyleToken = BaseProperties & {
  $type?: "strokeStyle";
  $value:
    | (typeof strokePredefinedValues)[number]
    | {
        dashArray: DimensionToken["$value"][];
        lineCap: (typeof lineCapPredefinedValues)[number];
      }
    | ReferenceValue;
};

export type BorderToken = BaseProperties & {
  $type?: "border";
  $value:
    | {
        width: DimensionToken["$value"];
        style: StrokeStyleToken["$value"];
        color: ColorToken["$value"];
      }
    | ReferenceValue;
};

export type TransitionToken = BaseProperties & {
  $type?: "transition";
  $value:
    | {
        duration: DurationToken["$value"];
        delay: DurationToken["$value"];
        timingFunction: CubicBezierToken["$value"];
      }
    | ReferenceValue;
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
  | ReferenceValue;

export type ShadowToken = BaseProperties & {
  $type?: "shadow";
  $value: ShadowValue | ShadowValue[] | ReferenceValue;
};

export type GradientToken = BaseProperties & {
  $type?: "gradient";
  $value:
    | (
        | {
            color: ColorToken["$value"];
            position: NumberToken["$value"];
          }
        | ReferenceValue
      )[]
    | ReferenceValue;
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
    | ReferenceValue;
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
  { $type: string; $value: any }
>;

export type TokenType = Exclude<Token["$type"], undefined>;
export type TokenValue = Token["$value"];
export type TokenCompositeValue = Exclude<
  | TypographyToken["$value"]
  | ShadowToken["$value"]
  | GradientToken["$value"]
  | TransitionToken["$value"]
  | StrokeStyleToken["$value"]
  | BorderToken["$value"],
  ReferenceValue
>;

export type TokenGroupProperties = {
  $type?: TokenType;
  $description?: string;
  $extensions?: object;
};

export type TokenGroup = TokenGroupProperties & {
  [key: string]: Token | TokenGroup | string;
};
