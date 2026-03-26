import { ansi } from "./ansi.js";

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
    console.log(highlighter.warn(args.join(" ")));
  },
  info(...args: unknown[]) {
    console.log(highlighter.info(args.join(" ")));
  },
  success(...args: unknown[]) {
    console.log(highlighter.success(args.join(" ")));
  },
  log(...args: unknown[]) {
    console.log(args.join(" "));
  },
  break() {
    console.log("");
  },
};
