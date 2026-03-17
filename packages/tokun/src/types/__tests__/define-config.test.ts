import { defineConfig, extendConfig } from "types/define-config.js";
import { describe, expect, it } from "vitest";

describe("defineConfig", () => {
  it("should return the config object as-is", () => {
    const config = {
      data: { color: { $type: "color" as const, $value: "#ff0000" } },
      options: {
        loader: "dtcg-json",
        platforms: [
          {
            name: "css",
            format: "css",
            outputs: [{ name: "tokens.css" }],
          },
        ],
      },
    };

    const result = defineConfig(config);
    expect(result).toBe(config);
  });
});

describe("extendConfig", () => {
  it("should deep-merge base config with overrides", () => {
    const base = defineConfig({
      data: { color: { $type: "color" as const, $value: "#ff0000" } },
      options: {
        loader: "dtcg-json",
        platforms: [
          {
            name: "css",
            format: "css",
            outputs: [{ name: "tokens.css" }],
          },
        ],
      },
    });

    const extended = extendConfig(base, {
      data: { color2: { $type: "color" as const, $value: "#00ff00" } },
    });

    expect(extended.data).toHaveProperty("color");
    expect(extended.data).toHaveProperty("color2");
    expect(extended.options).toBeDefined();
  });

  it("should override platforms when provided", () => {
    const base = defineConfig({
      data: {},
      options: {
        loader: "dtcg-json",
        platforms: [
          {
            name: "css",
            format: "css",
            outputs: [{ name: "tokens.css" }],
          },
        ],
      },
    });

    const extended = extendConfig(base, {
      options: {
        loader: "dtcg-json",
        platforms: [
          {
            name: "scss",
            format: "scss",
            outputs: [{ name: "tokens.scss" }],
          },
        ],
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { platforms } = extended.options!;
    expect(platforms).toHaveLength(1);
    expect(platforms[0]!.name).toBe("scss");
  });
});
