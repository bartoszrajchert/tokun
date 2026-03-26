import { build } from "builder/tokun.js";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { glob } from "tinyglobby";
import { Config } from "types/define-config.js";
import { logger } from "utils/logger.js";
import { isObject } from "utils/object-utils.js";
import { formatNames, loaderNames } from "utils/registry.js";
import { z } from "zod/v4-mini";
import { startMessage } from "./helpers.js";

const ConfigSchema = z.strictObject({
  data: z.union([
    z.string(),
    z.array(z.string()),
    z.looseObject({}),
    z.array(z.union([z.string(), z.looseObject({})])),
  ]),
  options: z.optional(
    z.looseObject({
      loader: z.union([z.string(), z.looseObject({})]),
      platforms: z.array(z.looseObject({})),
    }),
  ),
});

export async function runBuild({
  config,
  input,
  output,
  loader,
  format,
}: {
  config?: string;
  input?: string;
  output?: string;
  loader?: string;
  format?: string;
}) {
  startMessage("build");

  if (!config && !input) {
    const defaultConfigPath = path.resolve("config.json");

    if (existsSync(defaultConfigPath)) {
      config = defaultConfigPath;
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

  if (config && (loader || format)) {
    throw new Error(
      "You cannot provide --loader or --format when using a config file.",
    );
  }

  if (config) {
    await readConfigFile(config);
  } else if (input && output) {
    await readInputFile(input, output, loader, format);
  }
}

/**
 * Read config file.
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

  const absoluteConfigPath = path.resolve(globConfigPath[0]!);
  const absoluteConfigDir = path.dirname(absoluteConfigPath);

  let config: Config;

  if (absoluteConfigPath.endsWith(".json")) {
    const raw = readFileSync(absoluteConfigPath, "utf-8");
    config = JSON.parse(raw);
  } else {
    const fileURL = pathToFileURL(absoluteConfigPath).href;
    config = (await import(fileURL)).default;
  }

  const validation = ConfigSchema.safeParse(config);
  if (!validation.success) {
    throw new Error(
      `Invalid config shape: ${JSON.stringify(z.prettifyError(validation.error))}`,
    );
  }

  // If data is an object or array of objects, pass directly to build()
  if (
    isObject(config.data) ||
    (Array.isArray(config.data) && config.data.some(isObject))
  ) {
    const finishedBuild = build(config);

    for (const { name: buildName, content } of finishedBuild) {
      const name = `${absoluteConfigDir}/${buildName}`;
      const dir = path.dirname(name);
      logger.log(`Writing to ${name}`);

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      await writeFile(name, content);
    }
    return;
  }

  const resolvedData = Array.isArray(config.data)
    ? config.data.map((file) =>
        path.resolve(`${absoluteConfigDir}/${file as string}`),
      )
    : [path.resolve(`${absoluteConfigDir}/${config.data}`)];

  const tokenFiles = await glob(resolvedData, { absolute: true });

  const finishedBuild = build({
    ...config,
    data: tokenFiles.map((file) => readFileSync(file, "utf-8")),
  });

  for (const { name: buildName, content } of finishedBuild) {
    const name = `${absoluteConfigDir}/${buildName}`;
    const dir = path.dirname(name);
    logger.log(`Writing to ${name}`);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    await writeFile(name, content);
  }
}

/**
 * Read input file and run parse.
 */
async function readInputFile(
  filePath: string,
  outputFilePath: string,
  selectedLoader?: string,
  selectedFormat?: string,
) {
  logger.log(filePath);

  const loader = selectedLoader ?? loaderNames[0];

  if (!loader) {
    throw new Error("No loaders are registered.");
  }

  if (!loaderNames.includes(loader as (typeof loaderNames)[number])) {
    throw new Error(
      `Invalid loader \"${loader}\". Available loaders: ${loaderNames.join(", ")}`,
    );
  }

  const format = selectedFormat ?? inferFormatFromOutputPath(outputFilePath);

  if (!format) {
    throw new Error(
      `Cannot infer format from output file \"${outputFilePath}\". Use --format with one of: ${formatNames.join(", ")}`,
    );
  }

  if (!formatNames.includes(format as (typeof formatNames)[number])) {
    throw new Error(
      `Invalid format \"${format}\". Available formats: ${formatNames.join(", ")}`,
    );
  }

  const data = await readFile(filePath, "utf-8");

  const finishedBuild = build({
    data: [data],
    options: {
      loader,
      platforms: [
        {
          name: format,
          format,
          outputs: [{ name: outputFilePath }],
        },
      ],
    },
  });

  for (const { name, content } of finishedBuild) {
    const dir = path.dirname(name);
    logger.log(`Writing to ${name}`);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    await writeFile(name, content);
  }
}

function inferFormatFromOutputPath(outputFilePath: string): string | undefined {
  const normalizedPath = outputFilePath.toLowerCase();

  if (normalizedPath.endsWith(".detailed.json")) {
    return "detailed-json";
  }

  if (normalizedPath.endsWith(".scss")) {
    return "scss";
  }

  if (normalizedPath.endsWith(".css")) {
    return "css";
  }

  if (normalizedPath.endsWith(".json")) {
    return "flatten-json";
  }

  return undefined;
}
