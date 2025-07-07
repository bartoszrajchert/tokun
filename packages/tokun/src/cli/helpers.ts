import { bold, dim, green } from "kleur/colors";
import packageJson from "../../package.json" with { type: "json" };
import { logger } from "../utils/logger.js";

export function startMessage(msg: string) {
  logger.log(
    `${bold(green(`🚀 ${packageJson.name}`))} ${dim(green(`v${packageJson.version}`))} | Running ${bold(msg)}...`,
  );
}
