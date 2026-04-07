const runtimeProcess = typeof process === "undefined" ? undefined : process;

const colorsEnabled =
  runtimeProcess?.env.NO_COLOR === undefined &&
  runtimeProcess?.env.FORCE_COLOR !== "0" &&
  Boolean(runtimeProcess?.stdout?.isTTY);

function apply(code: string, value: unknown): string {
  const text = String(value);

  if (!colorsEnabled) {
    return text;
  }

  return `\u001B[${code}m${text}\u001B[0m`;
}

export const ansi = {
  red(value: unknown): string {
    return apply("31", value);
  },
  yellow(value: unknown): string {
    return apply("33", value);
  },
  cyan(value: unknown): string {
    return apply("36", value);
  },
  green(value: unknown): string {
    return apply("32", value);
  },
  dim(value: unknown): string {
    return apply("2", value);
  },
  bold(value: unknown): string {
    return apply("1", value);
  },
};
