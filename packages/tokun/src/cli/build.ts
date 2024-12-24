import { build } from "builder/tokun.js";
import path from "node:path";
import { pathToFileURL } from "node:url";
import prompts from "prompts";
import { glob } from "tinyglobby";
import { generateConfig } from "utils/generate-config.js";
import { formatNames, loaderNames } from "utils/registry.js";
import { startMessage } from "./helpers.js";

export async function runBuild({
  config,
  input,
  output,
}: {
  config?: string;
  input?: string;
  output?: string;
}) {
  startMessage("build");

  if (!config && !input) {
    throw new Error("You must provide either a config or input file.");
  }

  if (input && !output) {
    throw new Error("You must provide an output file.");
  }

  if (!input && output) {
    throw new Error("You must provide an input file.");
  }

  if (config && input) {
    throw new Error("You cannot provide both a config and input file.");
  }

  if (config) {
    await readConfigFile(config);
  } else if (input && output) {
    readInputFile(input, output);
  }
}

async function readConfigFile(filePath: string) {
  const paths = await glob([filePath], { absolute: true });

  if (paths.length === 0) {
    throw new Error("No files found.");
  }

  if (paths.length > 1) {
    throw new Error("More than one file found.");
  }

  const absolutePath = path.resolve(paths[0]!);
  const fileURL = pathToFileURL(absolutePath).href;
  const config = (await import(fileURL)).default;

  // TODO: validate config

  build(config);
}

/**
 * Read input file and run parse.
 */
async function readInputFile(filePath: string, outputFilePath: string) {
  console.log(filePath);

  const response = await prompts([
    {
      type: "select",
      name: "loader",
      message: "Select the loader",
      choices: loaderNames.map((name) => ({ title: name, value: name })),
    },
    {
      type: "select",
      name: "format",
      message: "Select the format",
      choices: formatNames.map((name) => ({ title: name, value: name })),
    },
  ]);

  const config = generateConfig({
    loader: response.loader,
    format: response.format,
    output: outputFilePath,
  });

  build({
    ...config,
    inputs: [filePath],
  });
}
