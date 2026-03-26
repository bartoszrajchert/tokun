import { ansi } from "./ansi.js";

export const logVerbosityLevels = {
  default: "default",
  silent: "silent",
  verbose: "verbose",
} as const;

export type LogVerbosity =
  (typeof logVerbosityLevels)[keyof typeof logVerbosityLevels];

export const logWarningLevels = {
  warn: "warn",
  error: "error",
  disabled: "disabled",
} as const;

export type LogWarningLevel =
  (typeof logWarningLevels)[keyof typeof logWarningLevels];

export type LogConfig = {
  verbosity: LogVerbosity;
  warnings: LogWarningLevel;
};

export const defaultLogConfig: LogConfig = {
  verbosity: logVerbosityLevels.silent,
  warnings: logWarningLevels.warn,
};

let currentLogConfig: LogConfig = { ...defaultLogConfig };

export function getLogConfig(): LogConfig {
  return { ...currentLogConfig };
}

export function setLogConfig(config: LogConfig | Partial<LogConfig>): void {
  currentLogConfig = {
    ...currentLogConfig,
    ...config,
  };
}

export function resolveLogConfig(
  ...configs: Array<Partial<LogConfig> | undefined>
): LogConfig {
  return configs.reduce<LogConfig>(
    (acc, config) => ({
      ...acc,
      ...config,
    }),
    { ...defaultLogConfig },
  );
}

function isSilent(): boolean {
  return currentLogConfig.verbosity === logVerbosityLevels.silent;
}

function shouldIgnoreWarnings(): boolean {
  return currentLogConfig.warnings === logWarningLevels.disabled;
}

export const highlighter = {
  error: ansi.red,
  warn: ansi.yellow,
  info: ansi.cyan,
  success: ansi.green,
};

export const logger = {
  error(...args: unknown[]) {
    console.log(highlighter.error(args.join(" ")));
  },
  warn(...args: unknown[]) {
    if (shouldIgnoreWarnings()) {
      return;
    }

    if (currentLogConfig.warnings === logWarningLevels.error) {
      throw new Error(args.join(" "));
    }

    if (isSilent()) {
      return;
    }

    console.log(highlighter.warn(args.join(" ")));
  },
  info(...args: unknown[]) {
    if (isSilent()) {
      return;
    }

    console.log(highlighter.info(args.join(" ")));
  },
  success(...args: unknown[]) {
    if (isSilent()) {
      return;
    }

    console.log(highlighter.success(args.join(" ")));
  },
  log(...args: unknown[]) {
    if (isSilent()) {
      return;
    }

    console.log(args.join(" "));
  },
  break() {
    if (isSilent()) {
      return;
    }

    console.log("");
  },
};
