import packageJson from "../../package.json" with { type: "json" };
import { ansi } from "../utils/ansi.js";
import { logger } from "../utils/logger.js";

export function startMessage(msg: string) {
  logger.break();
  logger.log(
    `${ansi.bold(ansi.green(`🥷 ${packageJson.name}`))} ${ansi.dim(ansi.green(`v${packageJson.version}`))} | Running ${ansi.bold(msg)}...`,
  );
}
