import { defineConfig } from "tsup";

export default defineConfig((options) => [
  {
    entry: ["./src/builder/node/index.ts"],
    clean: !options.watch,
    format: ["esm"],
    target: ["es6"],
    minify: !options.watch,
    dts: true,
    outDir: "./dist/node",
  },
  {
    entry: ["./src/builder/browser/index.ts"],
    clean: !options.watch,
    format: ["esm"],
    target: ["es6"],
    minify: !options.watch,
    dts: true,
    outDir: "./dist/browser",
  },
  {
    entry: ["./src/validators/index.ts"],
    clean: !options.watch,
    format: ["esm"],
    target: ["es6"],
    minify: !options.watch,
    dts: true,
    outDir: "./dist/validators",
  },
  {
    entry: ["./src/utils/index.ts"],
    clean: !options.watch,
    format: ["esm"],
    target: ["es6"],
    minify: !options.watch,
    dts: true,
    outDir: "./dist/utils",
  },
  {
    entry: ["./src/types/index.ts"],
    clean: !options.watch,
    format: ["esm"],
    target: ["es6"],
    dts: {
      only: true,
    },
    outDir: "./dist/types",
  },
  {
    clean: true,
    dts: true,
    entry: ["./src/cli/index.ts"],
    format: ["esm"],
    minify: !options.watch,
    target: "esnext",
    outDir: "./dist/cli",
    banner: {
      // This is a workaround for the following issue:
      // - commander.js uses require() to import modules
      js: `
      import { createRequire } from 'node:module';
      const require = createRequire(import.meta.url);
      `,
    },
  },
]);
