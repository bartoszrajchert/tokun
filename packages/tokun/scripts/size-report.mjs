#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageDir = path.resolve(scriptDir, "..");
const distDir = path.join(packageDir, "dist");

const entryFiles = [
  "dist/index.js",
  "dist/browser/index.js",
  "dist/validators/index.js",
  "dist/cli/index.js",
];

function formatBytes(value) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(2)} MB`;
}

function walkFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const output = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      output.push(...walkFiles(fullPath));
      continue;
    }

    output.push(fullPath);
  }

  return output;
}

function getCompressedSizes(filePath) {
  const content = readFileSync(filePath);

  return {
    raw: content.length,
    gzip: gzipSync(content, { level: 9 }).length,
    brotli: brotliCompressSync(content, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11,
      },
    }).length,
  };
}

function collectDistSummary() {
  const files = walkFiles(distDir);
  const summary = {
    files: files.length,
    raw: 0,
    js: 0,
    dts: 0,
    dtsMap: 0,
    other: 0,
  };

  const topFiles = files
    .map((filePath) => {
      const size = statSync(filePath).size;
      summary.raw += size;

      if (filePath.endsWith(".js")) {
        summary.js += size;
      } else if (filePath.endsWith(".d.ts")) {
        summary.dts += size;
      } else if (filePath.endsWith(".d.ts.map")) {
        summary.dtsMap += size;
      } else {
        summary.other += size;
      }

      return {
        filePath,
        size,
      };
    })
    .sort((left, right) => right.size - left.size)
    .slice(0, 10);

  return {
    summary,
    topFiles,
  };
}

function readPackStats() {
  const output = execSync("npm pack --dry-run --json", {
    cwd: packageDir,
    encoding: "utf-8",
  });

  const parsed = JSON.parse(output);
  const details = Array.isArray(parsed) ? parsed[0] : undefined;

  return {
    tarballSize: details?.size ?? 0,
    unpackedSize: details?.unpackedSize ?? 0,
    files: details?.files?.length ?? 0,
  };
}

function print() {
  const { summary, topFiles } = collectDistSummary();
  const packStats = readPackStats();

  console.log("tokun size report");
  console.log("");
  console.log(`dist files: ${summary.files}`);
  console.log(`dist total: ${formatBytes(summary.raw)} (${summary.raw} B)`);
  console.log(`dist js: ${formatBytes(summary.js)} (${summary.js} B)`);
  console.log(`dist d.ts: ${formatBytes(summary.dts)} (${summary.dts} B)`);
  console.log(
    `dist d.ts.map: ${formatBytes(summary.dtsMap)} (${summary.dtsMap} B)`,
  );
  console.log(`dist other: ${formatBytes(summary.other)} (${summary.other} B)`);
  console.log("");
  console.log("entry files:");

  for (const entryFile of entryFiles) {
    const absoluteEntryPath = path.join(packageDir, entryFile);

    if (!existsSync(absoluteEntryPath)) {
      console.log(`- ${entryFile}: missing`);
      continue;
    }

    const sizes = getCompressedSizes(absoluteEntryPath);
    console.log(
      `- ${entryFile}: raw ${formatBytes(sizes.raw)} | gzip ${formatBytes(sizes.gzip)} | brotli ${formatBytes(sizes.brotli)}`,
    );
  }

  console.log("");
  console.log("largest dist files:");
  for (const topFile of topFiles) {
    const relativePath = path.relative(packageDir, topFile.filePath);
    console.log(`- ${relativePath}: ${formatBytes(topFile.size)}`);
  }

  console.log("");
  console.log("npm pack --dry-run:");
  console.log(
    `- tarball ${formatBytes(packStats.tarballSize)} | unpacked ${formatBytes(packStats.unpackedSize)} | files ${packStats.files}`,
  );
}

print();
