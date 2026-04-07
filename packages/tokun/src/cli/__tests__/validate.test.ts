import { runValidate } from "cli/validate.js";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { setLogConfig } from "utils/logger.js";
import { beforeEach, describe, expect, it } from "vitest";

function createTempDir(prefix: string): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

describe("runValidate", () => {
  beforeEach(() => {
    setLogConfig({
      verbosity: "silent",
      warnings: "warn",
    });
  });

  it("passes for valid token files", async () => {
    const tempDir = createTempDir("tokun-validate-");
    const filePath = path.join(tempDir, "valid.tokens.json");

    writeFileSync(
      filePath,
      JSON.stringify({
        color: {
          primary: {
            $type: "color",
            $value: {
              colorSpace: "srgb",
              components: [0, 0, 0],
              hex: "#000000",
            },
          },
        },
      }),
    );

    try {
      await expect(runValidate([filePath])).resolves.toBeUndefined();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("fails for invalid token files", async () => {
    const tempDir = createTempDir("tokun-validate-");
    const filePath = path.join(tempDir, "invalid.tokens.json");

    writeFileSync(
      filePath,
      JSON.stringify({
        color: {
          primary: {
            $value: "#000000",
          },
        },
      }),
    );

    try {
      await expect(runValidate([filePath])).rejects.toThrow(
        "Validation finished with 1 error",
      );
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
