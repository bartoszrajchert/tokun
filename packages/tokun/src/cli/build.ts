import { build } from "builder/tokun.js";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
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

  if (!config) {
    if (existsSync("/config.json")) {
      config = "/config.json";
    }
  }

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

/**
 * Read config file.
 *
 * TODO: handle .ts files
 * TODO: handle .json files
 *
 * @param configPath
 */
async function readConfigFile(configPath: string) {
  const globConfigPath = await glob([configPath], { absolute: true });

  if (globConfigPath.length === 0) {
    throw new Error("Config file has not been found.");
  }

  if (globConfigPath.length > 1) {
    throw new Error("More than one file found. Provide only one config file.");
  }

  const absolutePath = path.resolve(globConfigPath[0]!);
  const fileURL = pathToFileURL(absolutePath).href;
  const config = (await import(fileURL)).default;

  // TODO: validate config

  const tokenFiles = await glob(config.data, { absolute: true });

  const finishedBuild = build({
    ...config,
    data: tokenFiles.map((file) => readFileSync(file, "utf-8")),
  });

  for (const { name, content } of finishedBuild) {
    const dir = path.dirname(name);
    console.log(`Writing to ${name}`);

    if (!existsSync(dir)) {
      mkdirSync(dir), { recursive: true };
    }

    await writeFile(name, content);
  }
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
    name: outputFilePath,
  });

  const data = await readFile(filePath, "utf-8");

  const finishedBuild = build({
    ...config,
    data: [data],
  });

  for (const { name, content } of finishedBuild) {
    const dir = path.dirname(name);
    console.log(`Writing to ${name}`);

    if (!existsSync(dir)) {
      mkdirSync(dir), { recursive: true };
    }

    await writeFile(name, content);
  }
}
