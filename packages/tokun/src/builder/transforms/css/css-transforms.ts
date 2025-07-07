import { TransformGroup } from "utils/types.js";
import { cssBorderStyleTransform } from "./css-border-style-transform.js";
import { cssFontTransform } from "./css-font-transform.js";
import { cssGradientTransform } from "./css-gradient-transform.js";
import { cssShadowTransform } from "./css-shadow-transform.js";
import { cssUnitTransform } from "./css-unit-transform.js";
import { cssVariableSafeTransform } from "./css-variable-safe-transform.js";

export const cssTransforms: TransformGroup = {
  name: "css-transforms",
  transforms: [
    cssBorderStyleTransform,
    cssUnitTransform,
    cssFontTransform,
    cssGradientTransform,
    cssShadowTransform,
    cssVariableSafeTransform,
  ],
};
