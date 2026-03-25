import { ConfigOptions } from "types/define-config.js";
import { cssFormat } from "../builder/formats/css-format.js";
import { detailedJsonFormat } from "../builder/formats/detailed-json-format.js";
import { flattenJsonFormat } from "../builder/formats/flatten-json-format.js";
import { scssFormat } from "../builder/formats/scss-format.js";
import { dtcgJsonLoader } from "../builder/loaders/dtcg-json-loader.js";
import { cssBorderStyleTransform } from "../builder/transforms/css/css-border-style-transform.js";
import { cssFontTransform } from "../builder/transforms/css/css-font-transform.js";
import { cssGradientTransform } from "../builder/transforms/css/css-gradient-transform.js";
import { cssShadowTransform } from "../builder/transforms/css/css-shadow-transform.js";
import { cssTransforms } from "../builder/transforms/css/css-transforms.js";
import { cssUnitTransform } from "../builder/transforms/css/css-unit-transform.js";
import { cssVariableSafeTransform } from "../builder/transforms/css/css-variable-safe-transform.js";
import {
  camelCaseTransform,
  kebabCaseTransform,
  pascalCaseTransform,
  snakeCaseTransform,
} from "../builder/transforms/name-transforms.js";
import { Format, Loader, Transform, TransformGroup } from "./types.js";

export const formatRegistry: Format[] = [
  cssFormat,
  detailedJsonFormat,
  flattenJsonFormat,
  scssFormat,
];
export const formatNames = [
  ...formatRegistry.map((format) => format.name),
] as const;
export type FormatName = (typeof formatNames)[number];

export const loaderRegistry: Loader[] = [dtcgJsonLoader];
export const loaderNames = [
  ...loaderRegistry.map((loader) => loader.name),
] as const;
export type LoaderName = (typeof loaderNames)[number];

export const transformRegistry: (Transform | TransformGroup)[] = [
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

/**
 * Generate basic config options from selected loader/format.
 */
export function generateConfig({
  loader,
  format,
  name = "default",
}: {
  loader: LoaderName | string;
  format: FormatName | string;
  name?: string;
}): ConfigOptions {
  const transformPresets: Record<string, string[]> = {
    css: ["css-transforms"],
    scss: ["css-transforms"],
  };

  const outputNameByFormat: Record<string, string> = {
    css: "tokens.css",
    scss: "tokens.scss",
    "detailed-json": "tokens.detailed.json",
    "flatten-json": "tokens.json",
  };

  return {
    loader,
    platforms: [
      {
        name,
        format,
        transforms: transformPresets[format] ?? [],
        outputs: [
          {
            name: outputNameByFormat[format] ?? "tokens.out",
          },
        ],
      },
    ],
  };
}

/**
 * Register a custom format.
 */
export function registerFormat(format: Format): void {
  formatRegistry.push(format);
}

/**
 * Register a custom transform or transform group.
 */
export function registerTransform(transform: Transform | TransformGroup): void {
  transformRegistry.push(transform);
}

/**
 * Register a custom loader.
 */
export function registerLoader(loader: Loader): void {
  loaderRegistry.push(loader);
}
