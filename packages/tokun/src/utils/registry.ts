import { cssFormat } from "../builder/formats/css-format.js";
import { detailedJsonFormat } from "../builder/formats/detailed-json-format.js";
import { flattenJsonFormat } from "../builder/formats/flatten-json-format.js";
import { dtcgJsonLoader } from "../builder/loaders/dtcg-json-loader.js";
import { camelCaseTransform } from "../builder/transforms/camel-case-transform.js";
import { cssBorderStyleTransform } from "../builder/transforms/css/css-border-style-transform.js";
import { cssFontTransform } from "../builder/transforms/css/css-font-transform.js";
import { cssGradientTransform } from "../builder/transforms/css/css-gradient-transform.js";
import { cssShadowTransform } from "../builder/transforms/css/css-shadow-transform.js";
import { cssTransforms } from "../builder/transforms/css/css-transforms.js";
import { cssUnitTransform } from "../builder/transforms/css/css-unit-transform.js";
import { cssVariableSafeTransform } from "../builder/transforms/css/css-variable-safe-transform.js";
import { kebabCaseTransform } from "../builder/transforms/kebab-case-transform.js";
import { pascalCaseTransform } from "../builder/transforms/pascal-case-transform.js";
import { snakeCaseTransform } from "../builder/transforms/snake-case-transform.js";

export const formatRegistry = [
  cssFormat,
  detailedJsonFormat,
  flattenJsonFormat,
];
export const formatNames = [
  ...formatRegistry.map((format) => format.name),
] as const;
export type FormatName = (typeof formatNames)[number];

export const loaderRegistry = [dtcgJsonLoader];
export const loaderNames = [
  ...loaderRegistry.map((loader) => loader.name),
] as const;
export type LoaderName = (typeof loaderNames)[number];

export const transformRegistry = [
  snakeCaseTransform,
  pascalCaseTransform,
  kebabCaseTransform,
  camelCaseTransform,
  cssVariableSafeTransform,
  cssTransforms,
  cssShadowTransform,
  cssGradientTransform,
  cssFontTransform,
  cssUnitTransform,
  cssBorderStyleTransform,
];
export const transformNames = [
  ...transformRegistry.map((transform) => transform.name),
] as const;
export type TransformName = (typeof transformNames)[number];
