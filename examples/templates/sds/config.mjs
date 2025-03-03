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
  data: ["templates/sds/sds.tokens.json"],
  options: {
    loader: dtcgJsonLoader,
    platforms: [
      {
        name: "css",
        format: cssFormat,
        transforms: [kebabCaseTransform, cssTransforms],
        outputs: [
          {
            name: "dist/sds/output.css",
            filter: ({ path }) => !path.includes("typography"),
          },
          {
            name: "dist/sds/typography.css",
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
            name: "dist/sds/output-flatten.json",
          },
        ],
      },
    ],
  },
};
