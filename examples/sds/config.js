import {
  camelCaseTransform,
  cssFormat,
  cssTransforms,
  defineParseConfig,
  dtcgJsonLoader,
  flattenJsonFormat,
  kebabCaseTransform,
} from "tokun";

export default defineParseConfig({
  inputs: ["examples/sds/sds.tokens.json"],
  loader: dtcgJsonLoader,
  formats: [
    {
      format: cssFormat,
      transforms: [kebabCaseTransform, cssTransforms],
      files: [
        {
          output: "dist/output.css",
          filter: ({ path }) => !path.includes("typography"),
        },
        {
          output: "dist/typography.css",
          filter: ({ path }) => path.includes("typography"),
        },
      ],
      config: { outputReferences: true },
    },
    {
      format: flattenJsonFormat,
      transforms: [camelCaseTransform],
      files: [
        {
          output: "dist/output-flatten.json",
        },
      ],
    },
  ],
});
