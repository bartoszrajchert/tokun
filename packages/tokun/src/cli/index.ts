#!/usr/bin/env node

import { Command } from "commander";
import { red } from "kleur/colors";
import packageJson from "../../package.json";
import { runBuild } from "./build.js";
import { logger } from "./utils/logger.js";
import { runValidate } from "./validate.js";

const handleSigTerm = () => process.exit(0);

process.on("SIGTERM", handleSigTerm);
process.on("SIGINT", handleSigTerm);

const program = new Command("tokun")
  .description(packageJson.description)
  .version(packageJson.version);

program
  .command("build")
  .description(
    "Build design tokens to a different format. This builder is simplified, to use more advencent option please create a custom script.",
  )
  .option("-c, --config <config>", "The path to the config file.")
  .option(
    "-i, --input <input>",
    "The input file. This can be a glob pattern. See `tinyglobby` for more information.",
  )
  .option("-o, --output <output>", "The output file to write.")
  .action(runBuild);

program
  .command("validate")
  .description("Validate design tokens against the DTCG format.")
  .argument(
    "<inputs...>",
    "The input files to validate. This can be a glob pattern. See `tinyglobby` for more information.",
  )
  .action(runValidate);

program.on("command:*", function () {
  logger.error(`Invalid command: ${process.argv.slice(2).join(" ")}`);
  logger.error("See --help for a list of available commands.");
  process.exit(1);
});

program.parseAsync().catch((error) => {
  logger.break();
  logger.error(red("Unexpected error. Please report it as a bug:"));
  logger.error(error);
  process.exit(1);
});

logger.break();
