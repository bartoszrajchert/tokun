import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Config } from "types/define-config.js";
import {
  getLogConfig,
  logger,
  resolveLogConfig,
  setLogConfig,
  type LogConfig,
} from "utils/logger.js";
import { build as coreBuild } from "./tokun.js";

export function build(
  config: Config,
  buildOptions?: { writeTo?: string; log?: Partial<LogConfig> },
): ReturnType<typeof coreBuild> {
  const previousLogConfig = getLogConfig();
  const nextLogConfig = resolveLogConfig(config.log, buildOptions?.log);

  setLogConfig(nextLogConfig);

  try {
    const result = coreBuild(config, { log: nextLogConfig });

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
  } finally {
    setLogConfig(previousLogConfig);
  }
}
