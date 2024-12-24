export default {
  inputs: ["examples/basic/basic.tokens.json"],
  loader: "dtcg-json",
  formats: [
    {
      format: "css",
      transforms: ["kebab-case", "css-transforms"],
      files: [
        {
          output: "dist/vars.css",
        },
      ],
      config: { outputReferences: true },
    },
    {
      format: "flatten-json",
      transforms: ["camel-case"],
      files: [
        {
          output: "dist/vars.json",
        },
      ],
    },
  ],
};
