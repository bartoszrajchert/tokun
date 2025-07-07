/** @type {import('tokun/types').Config} */
export default {
  data: ["basic.tokens.json"],
  options: {
    loader: "dtcg-json",
    platforms: [
      {
        name: "css",
        format: "css",
        transforms: ["kebab-case", "css-transforms"],
        outputs: [
          {
            name: "dist/vars.css",
          },
        ],
        config: { outputReferences: false },
      },
    ],
  },
};
