import {
  defaultLogConfig,
  logger,
  logVerbosityLevels,
  logWarningLevels,
  setLogConfig,
} from "utils/logger.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("logger", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setLogConfig(defaultLogConfig);
    consoleLogSpy = vi
      .spyOn(console, "log")
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    setLogConfig(defaultLogConfig);
  });

  it("prints errors even when verbosity is silent", () => {
    setLogConfig({
      verbosity: logVerbosityLevels.silent,
      warnings: logWarningLevels.warn,
    });

    logger.error("fatal error");

    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it("suppresses neutral logs when verbosity is silent", () => {
    setLogConfig({
      verbosity: logVerbosityLevels.silent,
      warnings: logWarningLevels.warn,
    });

    logger.log("hello");
    logger.success("done");

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it("suppresses warnings when warning level is disabled", () => {
    setLogConfig({
      verbosity: logVerbosityLevels.verbose,
      warnings: logWarningLevels.disabled,
    });

    logger.warn("warning");

    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it("throws warnings as errors when warning level is error", () => {
    setLogConfig({
      verbosity: logVerbosityLevels.verbose,
      warnings: logWarningLevels.error,
    });

    expect(() => logger.warn("warning")).toThrowError("warning");
  });
});
