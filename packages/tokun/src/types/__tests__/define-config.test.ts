import { defineConfig } from "types/define-config.js";
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
