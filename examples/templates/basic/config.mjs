/** @type {import('tokun/types').Config} */
export default {
  data: ["templates/basic/basic.tokens.json"],
  options: {
    loader: "dtcg-json",
    platforms: [
      {
        name: "css",
        format: "css",
        transforms: ["kebab-case", "css-transforms"],
        outputs: [
          {
            name: "dist/basic/vars.css",
          },
        ],
        config: { outputReferences: true },
      },
      {
        name: "css",
        format: "flatten-json",
        transforms: ["camel-case"],
        outputs: [
          {
            name: "dist/basic/vars.json",
          },
        ],
      },
    ],
  },
};
