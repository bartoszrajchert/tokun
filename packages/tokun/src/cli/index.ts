#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  logger,
  logVerbosityLevels,
  logWarningLevels,
  setLogConfig,
  type LogConfig,
} from "../utils/logger.js";

type PackageMetadata = {
  version?: string;
  description?: string;
};

function readPackageMetadata(): { version: string; description: string } {
  try {
    const cliDir = path.dirname(fileURLToPath(import.meta.url));
    const packageJsonPath = path.resolve(cliDir, "../../package.json");
    const rawPackageMetadata = readFileSync(packageJsonPath, "utf-8");
    const packageMetadata = JSON.parse(rawPackageMetadata) as PackageMetadata;

    return {
      version: packageMetadata.version ?? "0.0.0",
      description: packageMetadata.description ?? "tokun",
    };
  } catch {
    return {
      version: "0.0.0",
      description: "tokun",
    };
  }
}

const packageMetadata = readPackageMetadata();

type BuildOptions = {
  config?: string;
  input?: string;
  output?: string;
  loader?: string;
  format?: string;
  silent?: boolean;
  verbose?: boolean;
  noWarn?: boolean;
};

type ValidateOptions = {
  inputs: string[];
  silent?: boolean;
  verbose?: boolean;
  noWarn?: boolean;
};

class CliUsageError extends Error {}

const handleSigTerm = () => process.exit(0);

process.on("SIGTERM", handleSigTerm);
process.on("SIGINT", handleSigTerm);

setLogConfig({
  verbosity: logVerbosityLevels.verbose,
  warnings: logWarningLevels.warn,
});

function resolveCliLogConfig({
  silent,
  verbose,
  noWarn,
}: {
  silent?: boolean;
  verbose?: boolean;
  noWarn?: boolean;
}): LogConfig {
  const verbosity = verbose
    ? logVerbosityLevels.verbose
    : silent
      ? logVerbosityLevels.silent
      : logVerbosityLevels.verbose;

  return {
    verbosity,
    warnings: noWarn ? logWarningLevels.disabled : logWarningLevels.warn,
  };
}

function hasCliLogOverride({
  silent,
  verbose,
  noWarn,
}: {
  silent?: boolean;
  verbose?: boolean;
  noWarn?: boolean;
}): boolean {
  return Boolean(silent || verbose || noWarn);
}

function printMainHelp() {
  logger.log(`tokun v${packageMetadata.version}`);
  logger.log(packageMetadata.description);
  logger.break();
  logger.log("Usage:");
  logger.log("  tokun <command> [options]");
  logger.break();
  logger.log("Commands:");
  logger.log(
    "  build       Build design tokens to a different format. This builder is simplified, to use more advencent option please create a custom script.",
  );
  logger.log("  validate    Validate design tokens against the DTCG format.");
  logger.break();
  logger.log("Global options:");
  logger.log("  -v, --version  Show version number");
  logger.log("  -h, --help     Show this help message");
}

function printBuildHelp() {
  logger.log("Build design tokens to a different format.");
  logger.break();
  logger.log("Usage:");
  logger.log("  tokun build [options]");
  logger.break();
  logger.log("Options:");
  logger.log("  -c, --config <config>  The path to the config file.");
  logger.log("  -i, --input <input>    Path to a single input token file.");
  logger.log("  -o, --output <output>  The output file to write.");
  logger.log(
    "  -l, --loader <loader>  Loader name for input/output mode (default: first registered loader).",
  );
  logger.log(
    "  -f, --format <format>  Format name for input/output mode (inferred from output extension when omitted).",
  );
  logger.log("  -s, --silent           Silence non-fatal logs");
  logger.log("  -v, --verbose          Enable verbose logs (default)");
  logger.log("  -n, --no-warn          Disable warning logs");
  logger.log("  -h, --help             Show help for build command");
}

function printValidateHelp() {
  logger.log("Validate design tokens against the DTCG format.");
  logger.break();
  logger.log("Usage:");
  logger.log("  tokun validate <inputs...>");
  logger.break();
  logger.log("Arguments:");
  logger.log(
    "  <inputs...>  The input files to validate. This can be a glob pattern. See `tinyglobby` for more information.",
  );
  logger.break();
  logger.log("Options:");
  logger.log("  -s, --silent  Silence non-fatal logs");
  logger.log("  -v, --verbose Enable verbose logs (default)");
  logger.log("  -n, --no-warn Disable warning logs");
  logger.log("  -h, --help   Show help for validate command");
}

function getOptionValue(
  args: string[],
  index: number,
  shortName: string,
  longName: string,
): {
  value: string;
  nextIndex: number;
} {
  const currentArg = args[index]!;
  const normalizedShortName = `${shortName}=`;
  const normalizedLongName = `${longName}=`;

  if (currentArg.startsWith(normalizedLongName)) {
    const value = currentArg.slice(normalizedLongName.length);

    if (!value) {
      throw new CliUsageError(`Missing value for ${longName}.`);
    }

    return { value, nextIndex: index };
  }

  if (currentArg.startsWith(normalizedShortName)) {
    const value = currentArg.slice(normalizedShortName.length);

    if (!value) {
      throw new CliUsageError(`Missing value for ${shortName}.`);
    }

    return { value, nextIndex: index };
  }

  const value = args[index + 1];

  if (!value || value.startsWith("-")) {
    throw new CliUsageError(`Missing value for ${longName}.`);
  }

  return { value, nextIndex: index + 1 };
}

function parseBuildArgs(args: string[]): BuildOptions | "help" {
  const options: BuildOptions = {};

  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;

    if (arg === "-h" || arg === "--help") {
      printBuildHelp();
      return "help";
    }

    if (
      arg === "-c" ||
      arg === "--config" ||
      arg.startsWith("-c=") ||
      arg.startsWith("--config=")
    ) {
      const { value, nextIndex } = getOptionValue(
        args,
        index,
        "-c",
        "--config",
      );
      options.config = value;
      index = nextIndex;
      continue;
    }

    if (
      arg === "-i" ||
      arg === "--input" ||
      arg.startsWith("-i=") ||
      arg.startsWith("--input=")
    ) {
      const { value, nextIndex } = getOptionValue(args, index, "-i", "--input");
      options.input = value;
      index = nextIndex;
      continue;
    }

    if (
      arg === "-o" ||
      arg === "--output" ||
      arg.startsWith("-o=") ||
      arg.startsWith("--output=")
    ) {
      const { value, nextIndex } = getOptionValue(
        args,
        index,
        "-o",
        "--output",
      );
      options.output = value;
      index = nextIndex;
      continue;
    }

    if (
      arg === "-l" ||
      arg === "--loader" ||
      arg.startsWith("-l=") ||
      arg.startsWith("--loader=")
    ) {
      const { value, nextIndex } = getOptionValue(
        args,
        index,
        "-l",
        "--loader",
      );
      options.loader = value;
      index = nextIndex;
      continue;
    }

    if (
      arg === "-f" ||
      arg === "--format" ||
      arg.startsWith("-f=") ||
      arg.startsWith("--format=")
    ) {
      const { value, nextIndex } = getOptionValue(
        args,
        index,
        "-f",
        "--format",
      );
      options.format = value;
      index = nextIndex;
      continue;
    }

    if (arg === "-s" || arg === "--silent") {
      options.silent = true;
      continue;
    }

    if (arg === "-v" || arg === "--verbose") {
      options.verbose = true;
      continue;
    }

    if (arg === "-n" || arg === "--no-warn") {
      options.noWarn = true;
      continue;
    }

    throw new CliUsageError(`Unknown option for build command: ${arg}`);
  }

  return options;
}

function parseValidateArgs(args: string[]): ValidateOptions | "help" {
  const options: ValidateOptions = { inputs: [] };

  for (const arg of args) {
    if (arg === "-h" || arg === "--help") {
      printValidateHelp();
      return "help";
    }

    if (arg === "-s" || arg === "--silent") {
      options.silent = true;
      continue;
    }

    if (arg === "-v" || arg === "--verbose") {
      options.verbose = true;
      continue;
    }

    if (arg === "-n" || arg === "--no-warn") {
      options.noWarn = true;
      continue;
    }

    if (arg.startsWith("-")) {
      throw new CliUsageError(`Unknown option for validate command: ${arg}`);
    }

    options.inputs.push(arg);
  }

  if (options.inputs.length === 0) {
    throw new CliUsageError("Missing required argument: <inputs...>");
  }

  return options;
}

function printHelpForCommand(command?: string) {
  if (!command) {
    printMainHelp();
    return;
  }

  if (command === "build") {
    printBuildHelp();
    return;
  }

  if (command === "validate") {
    printValidateHelp();
    return;
  }

  throw new CliUsageError(`Unknown help topic: ${command}`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printMainHelp();
    return;
  }

  const [command, ...restArgs] = args;

  if (command === "-v" || command === "--version") {
    logger.log(packageMetadata.version);
    return;
  }

  if (command === "-h" || command === "--help") {
    printMainHelp();
    return;
  }

  if (command === "help") {
    printHelpForCommand(restArgs[0]);
    return;
  }

  if (command === "build") {
    const options = parseBuildArgs(restArgs);

    if (options === "help") {
      return;
    }

    const logConfig = resolveCliLogConfig(options);
    const hasLogOverride = hasCliLogOverride(options);

    setLogConfig(logConfig);

    const { runBuild } = await import("./build.js");

    await runBuild({
      config: options.config,
      input: options.input,
      output: options.output,
      loader: options.loader,
      format: options.format,
      log: logConfig,
      preferConfigLog: !hasLogOverride,
    });
    return;
  }

  if (command === "validate") {
    const options = parseValidateArgs(restArgs);

    if (options === "help") {
      return;
    }

    setLogConfig(resolveCliLogConfig(options));

    const { runValidate } = await import("./validate.js");

    await runValidate(options.inputs);
    return;
  }

  throw new CliUsageError(`Invalid command: ${args.join(" ")}`);
}

main().catch((error) => {
  logger.break();

  if (error instanceof CliUsageError) {
    logger.error(error.message);
    logger.error("See --help for a list of available commands.");
    process.exit(1);
  }

  if (error instanceof Error) {
    logger.error(error.message);
    process.exit(1);
  }

  logger.error(String(error));
  process.exit(1);
});
