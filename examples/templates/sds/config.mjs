import {
  camelCaseTransform,
  cssFormat,
  cssTransforms,
  dtcgJsonLoader,
  flattenJsonFormat,
  kebabCaseTransform,
} from "tokun";

/** @type {import('tokun/types').Config} */
export default {
  data: ["sds.tokens.json"],
  options: {
    loader: dtcgJsonLoader,
    platforms: [
      {
        name: "css",
        format: cssFormat,
        transforms: [kebabCaseTransform, cssTransforms],
        outputs: [
          {
            name: "dist/output.css",
            filter: ({ path }) => !path.includes("typography"),
          },
          {
            name: "dist/typography.css",
            filter: ({ path }) => path.includes("typography"),
          },
        ],
        config: { outputReferences: true },
      },
      {
        name: "json",
        format: flattenJsonFormat,
        transforms: [camelCaseTransform],
        outputs: [
          {
            name: "dist/output-flatten.json",
          },
        ],
      },
    ],
  },
};
