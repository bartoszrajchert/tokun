import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { Config } from "types/define-config.js";
import { logger } from "utils/logger.js";
import { build as coreBuild } from "./tokun.js";

export function build(
  config: Config,
  buildOptions?: { writeTo?: string },
): ReturnType<typeof coreBuild> {
  const result = coreBuild(config);

  if (buildOptions?.writeTo) {
    for (const { name, content } of result) {
      const filePath = path.join(buildOptions.writeTo, name);
      const dir = path.dirname(filePath);

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(filePath, content);
      logger.log(`Written to ${filePath}`);
    }
  }

  return result;
}
