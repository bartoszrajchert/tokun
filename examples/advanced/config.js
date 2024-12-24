import {
  cssDimensionTransform,
  cssFontTransform,
  cssFormat,
  cssGradientTransform,
  cssShadowTransform,
  cssVariableSafeTransform,
  defineParseConfig,
  dtcgJsonLoader,
  flattenJsonFormat,
  kebabCaseTransform,
} from "tokun";
import { isReference, unwrapReference } from "tokun/utils";
import { ValidatorError } from "tokun/validators";
import { z } from "zod";

export default defineParseConfig({
  inputs: [
    "examples/advanced/tokens/theme/*.tokens.json",
    "examples/advanced/tokens/base.tokens.json",
  ],
  loader: dtcgJsonLoader,
  customValidator: {
    types: {
      unknown: {
        validator: (token) =>
          z
            .object({
              $type: z.literal("unknown"),
              $value: z.any(),
              $description: z.string().optional(),
              $extensions: z.record(z.any()).optional(),
            })
            .safeParse(token).success,
      },
    },
    rules: [
      (flatten) => {
        /** @type {ValidatorError[]} */
        const errors = [];

        for (const [name, token] of flatten.entries()) {
          if (!name.startsWith("brand.") && !name.startsWith("alias.")) {
            errors.push({
              name: "startWith",
              message: `Token name must start with "brand" or "alias" in "${name}"`,
              path: name,
              value: name.split(".")[0],
            });
          }

          if (isReference(token.$value)) {
            const unwrappedValue = unwrapReference(token.$value);

            if (
              unwrappedValue.startsWith("alias.") &&
              (name.startsWith("alias.") || name.startsWith("brand."))
            ) {
              errors.push({
                name: "aliasReference",
                message: `Alias cannot reference another alias or brand in "${name}"`,
                path: name,
              });
            }

            if (
              unwrappedValue.startsWith("brand.") &&
              name.startsWith("brand.")
            ) {
              errors.push({
                name: "brandReference",
                message: "Brand cannot reference another brand",
                path: name,
              });
            }
          }
        }

        return { errors };
      },
    ],
  },
  formats: [
    {
      format: cssFormat,
      transforms: [
        kebabCaseTransform,
        cssDimensionTransform,
        cssVariableSafeTransform,
        cssFontTransform,
        cssShadowTransform,
        cssGradientTransform,
      ],
      files: [
        {
          output: "dist/sample.css",
          filter: ({ path }) => !path.includes("typography"),
        },
        {
          output: "dist/sample-typography.css",
          filter: ({ path }) => path.includes("typography"),
        },
      ],
      config: { outputReferences: true },
    },
    {
      format: flattenJsonFormat,
      transforms: [kebabCaseTransform, cssFontTransform, cssDimensionTransform],
      files: [
        {
          output: "dist/sample-flatten.json",
        },
      ],
    },
  ],
});
