import { build } from "builder/tokun.js";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { glob } from "tinyglobby";
import { Config } from "types/define-config.js";
import type { LogConfig } from "utils/logger.js";
import { logger, resolveLogConfig, setLogConfig } from "utils/logger.js";
import { isObject } from "utils/object-utils.js";
import { formatNames, loaderNames } from "utils/registry.js";
import * as z from "zod/v4-mini";
import { startMessage } from "./helpers.js";

const ConfigSchema = z.strictObject({
  data: z.union([
    z.string(),
    z.array(z.string()),
    z.looseObject({}),
    z.array(z.union([z.string(), z.looseObject({})])),
  ]),
  log: z.optional(
    z.looseObject({
      verbosity: z.optional(z.enum(["default", "silent", "verbose"])),
      warnings: z.optional(z.enum(["warn", "error", "disabled"])),
    }),
  ),
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
  log,
  preferConfigLog,
}: {
  config?: string;
  input?: string;
  output?: string;
  loader?: string;
  format?: string;
  log?: Partial<LogConfig>;
  preferConfigLog?: boolean;
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
    await readConfigFile(config, log, preferConfigLog);
  } else if (input && output) {
    await readInputFile(input, output, loader, format, log);
  }
}

/**
 * Read config file.
 *
 * @param configPath
 */
async function readConfigFile(
  configPath: string,
  log?: Partial<LogConfig>,
  preferConfigLog?: boolean,
) {
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

  const effectiveLog = preferConfigLog
    ? resolveLogConfig(log, config.log)
    : resolveLogConfig(config.log, log);

  setLogConfig(effectiveLog);

  // If data is an object or array of objects, pass directly to build()
  if (
    isObject(config.data) ||
    (Array.isArray(config.data) && config.data.some(isObject))
  ) {
    const finishedBuild = build(config, { log: effectiveLog });

    await writeBuildOutputs(finishedBuild, absoluteConfigDir);
    return;
  }

  const resolvedData = Array.isArray(config.data)
    ? config.data.map((file) => path.resolve(absoluteConfigDir, file as string))
    : [path.resolve(absoluteConfigDir, config.data)];

  const tokenFiles = await glob(resolvedData, { absolute: true });

  const finishedBuild = build(
    {
      ...config,
      data: tokenFiles.map((file) => readFileSync(file, "utf-8")),
    },
    { log: effectiveLog },
  );

  await writeBuildOutputs(finishedBuild, absoluteConfigDir);
}

/**
 * Read input file and run parse.
 */
async function readInputFile(
  filePath: string,
  outputFilePath: string,
  selectedLoader?: string,
  selectedFormat?: string,
  log?: Partial<LogConfig>,
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

  const finishedBuild = build(
    {
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
    },
    { log },
  );

  await writeBuildOutputs(finishedBuild);
}

async function writeBuildOutputs(
  outputs: ReturnType<typeof build>,
  baseDir?: string,
): Promise<void> {
  for (const { name, content } of outputs) {
    const outputPath = baseDir ? path.resolve(baseDir, name) : name;
    const dir = path.dirname(outputPath);

    logger.log(`Writing to ${outputPath}`);

    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    await writeFile(outputPath, content);
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
