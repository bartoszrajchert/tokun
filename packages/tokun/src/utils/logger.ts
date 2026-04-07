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

const runtimeProcess = typeof process === "undefined" ? undefined : process;

function supportsUnicode(): boolean {
  if (!runtimeProcess) {
    return true;
  }

  if (runtimeProcess.platform !== "win32") {
    return runtimeProcess.env.TERM !== "linux";
  }

  return Boolean(
    runtimeProcess.env.CI ||
      runtimeProcess.env.WT_SESSION ||
      runtimeProcess.env.ConEmuTask === "{cmd::Cmder}" ||
      runtimeProcess.env.TERM_PROGRAM === "vscode" ||
      runtimeProcess.env.TERM === "xterm-256color" ||
      runtimeProcess.env.TERM === "alacritty" ||
      runtimeProcess.env.TERMINAL_EMULATOR === "JetBrains-JediTerm",
  );
}

const unicodeSupported = supportsUnicode();

const logSymbols = {
  info: highlighter.info(unicodeSupported ? "ℹ" : "i"),
  success: highlighter.success(unicodeSupported ? "✔" : "√"),
  warn: highlighter.warn(unicodeSupported ? "⚠" : "‼"),
  error: highlighter.error(unicodeSupported ? "✖" : "×"),
} as const;

function joinArgs(args: unknown[]): string {
  return args.map((arg) => String(arg)).join(" ");
}

function withLevelPrefix(
  level: keyof typeof logSymbols,
  args: unknown[],
): string {
  const prefix = ansi.bold(logSymbols[level]);
  return `${prefix} ${joinArgs(args)}`;
}

export const logger = {
  error(...args: unknown[]) {
    console.log(withLevelPrefix("error", args));
  },
  warn(...args: unknown[]) {
    if (shouldIgnoreWarnings()) {
      return;
    }

    if (currentLogConfig.warnings === logWarningLevels.error) {
      throw new Error(joinArgs(args));
    }

    if (isSilent()) {
      return;
    }

    console.log(withLevelPrefix("warn", args));
  },
  info(...args: unknown[]) {
    if (isSilent()) {
      return;
    }

    console.log(withLevelPrefix("info", args));
  },
  success(...args: unknown[]) {
    if (isSilent()) {
      return;
    }

    console.log(withLevelPrefix("success", args));
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
  section(title: string) {
    if (isSilent()) {
      return;
    }

    console.log(ansi.bold(ansi.cyan(title)));
  },
};
