import {
  cssDimensionTransform,
  cssFontTransform,
  cssFormat,
  cssGradientTransform,
  cssShadowTransform,
  cssVariableSafeTransform,
  dtcgJsonLoader,
  flattenJsonFormat,
  kebabCaseTransform,
} from "tokun";
import { isReference, unwrapReference } from "tokun/utils";
import { dtcgValidator } from "tokun/validators";
import { z } from "zod";

/** @type {import('tokun/types').Config} */
export default {
  data: [
    "templates/advanced/tokens/theme/*.tokens.json",
    "templates/advanced/tokens/base.tokens.json",
  ],
  options: {
    loader: dtcgJsonLoader,
    validator: dtcgValidator,
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
          /** @type {import('tokun/validators').ValidatorError[]} */
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
    platforms: [
      {
        name: "css",
        format: cssFormat,
        transforms: [
          kebabCaseTransform,
          cssDimensionTransform,
          cssVariableSafeTransform,
          cssFontTransform,
          cssShadowTransform,
          cssGradientTransform,
        ],
        outputs: [
          {
            name: "dist/advanced/sample.css",
            filter: ({ path }) => !path.includes("typography"),
          },
          {
            name: "dist/advanced/sample-typography.css",
            filter: ({ path }) => path.includes("typography"),
          },
        ],
        config: { outputReferences: true },
      },
      {
        name: "json",
        format: flattenJsonFormat,
        transforms: [
          kebabCaseTransform,
          cssFontTransform,
          cssDimensionTransform,
        ],
        outputs: [
          {
            name: "dist/advanced/sample-flatten.json",
          },
        ],
      },
    ],
  },
};
