import { runBuild } from "cli/build.js";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

function createTempDir(prefix: string): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

describe("runBuild", () => {
  it("builds tokens from input/output mode", async () => {
    const tempDir = createTempDir("tokun-build-");
    const inputPath = path.join(tempDir, "tokens.json");
    const outputPath = path.join(tempDir, "tokens.scss");

    writeFileSync(
      inputPath,
      JSON.stringify({
        color: {
          primary: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [1, 0, 0],
              hex: "#ff0000",
            },
          },
        },
      }),
    );

    try {
      await runBuild({
        input: inputPath,
        output: outputPath,
        log: { verbosity: "silent" },
      });

      const output = readFileSync(outputPath, "utf-8");

      expect(output).toContain("$color-primary: #ff0000;");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("throws when format cannot be inferred", async () => {
    const tempDir = createTempDir("tokun-build-");
    const inputPath = path.join(tempDir, "tokens.json");

    writeFileSync(
      inputPath,
      JSON.stringify({
        color: {
          primary: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [1, 1, 1],
              hex: "#ffffff",
            },
          },
        },
      }),
    );

    try {
      await expect(
        runBuild({
          input: inputPath,
          output: path.join(tempDir, "tokens.out"),
          log: { verbosity: "silent" },
        }),
      ).rejects.toThrow("Cannot infer format");
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
