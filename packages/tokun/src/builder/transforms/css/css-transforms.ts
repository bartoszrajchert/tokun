import { TransformGroup } from "utils/types.js";
import { cssBorderStyleTransform } from "./css-border-style-transform.js";
import { cssDimensionTransform } from "./css-dimension-transform.js";
import { cssFontTransform } from "./css-font-transform.js";
import { cssGradientTransform } from "./css-gradient-transform.js";
import { cssShadowTransform } from "./css-shadow-transform.js";
import { cssVariableSafeTransform } from "./css-variable-safe-transform.js";

export const cssTransforms: TransformGroup = {
  name: "css-transforms",
  transforms: [
    cssBorderStyleTransform,
    cssDimensionTransform,
    cssFontTransform,
    cssGradientTransform,
    cssShadowTransform,
    cssVariableSafeTransform,
  ],
};
