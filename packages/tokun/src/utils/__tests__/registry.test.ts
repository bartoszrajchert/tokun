import {
  formatRegistry,
  loaderRegistry,
  registerFormat,
  registerLoader,
  registerTransform,
  transformRegistry,
} from "utils/registry.js";
import { Format, Loader, Transform } from "utils/types.js";
import { describe, expect, it } from "vitest";

describe("registry", () => {
  it("should have built-in formats registered", () => {
    const names = formatRegistry.map((f) => f.name);
    expect(names).toContain("css");
    expect(names).toContain("detailed-json");
    expect(names).toContain("flatten-json");
    expect(names).toContain("scss");
  });

  it("should have built-in loaders registered", () => {
    const names = loaderRegistry.map((l) => l.name);
    expect(names).toContain("dtcg-json");
  });

  it("should have built-in transforms registered", () => {
    const names = transformRegistry.map((t) => t.name);
    expect(names).toContain("kebab-case");
    expect(names).toContain("snake-case");
    expect(names).toContain("camel-case");
    expect(names).toContain("pascal-case");
    expect(names).toContain("css-transforms");
  });

  it("should register a custom format", () => {
    const initialCount = formatRegistry.length;
    const customFormat: Format = {
      name: "custom-test-format",
      formatter: () => "custom output",
    };

    registerFormat(customFormat);

    expect(formatRegistry.length).toBe(initialCount + 1);
    expect(formatRegistry.find((f) => f.name === "custom-test-format")).toBe(
      customFormat,
    );
  });

  it("should register a custom transform", () => {
    const initialCount = transformRegistry.length;
    const customTransform: Transform = {
      name: "custom-test-transform",
      type: "name",
      transformer: (name: string) => name.toUpperCase(),
    };

    registerTransform(customTransform);

    expect(transformRegistry.length).toBe(initialCount + 1);
    expect(
      transformRegistry.find((t) => t.name === "custom-test-transform"),
    ).toBe(customTransform);
  });

  it("should register a custom loader", () => {
    const initialCount = loaderRegistry.length;
    const customLoader: Loader = {
      name: "custom-test-loader",
      pattern: /\.custom$/,
      loadFn: () => new Map(),
    };

    registerLoader(customLoader);

    expect(loaderRegistry.length).toBe(initialCount + 1);
    expect(loaderRegistry.find((l) => l.name === "custom-test-loader")).toBe(
      customLoader,
    );
  });
});
