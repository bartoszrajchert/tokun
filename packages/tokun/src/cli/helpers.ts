import packageJson from "../../package.json" with { type: "json" };
import { ansi } from "../utils/ansi.js";
import { logger } from "../utils/logger.js";

export function startMessage(msg: string) {
  const separator = ansi.dim("-".repeat(56));

  logger.break();
  logger.log(separator);
  logger.log(
    `🥷 ${ansi.bold(packageJson.name)} ${ansi.dim(`v${packageJson.version}`)} ${ansi.dim("|")} ${ansi.bold(msg)}`,
  );
  logger.log(separator);
}
