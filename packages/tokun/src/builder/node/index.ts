import { dim, green } from "kleur/colors";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { assign } from "radash";
import { glob } from "tinyglobby";
import { Options } from "utils/define-config.js";
import { findInRegistry } from "utils/helpers.js";
import {
  formatRegistry,
  loaderRegistry,
  transformRegistry,
} from "utils/registry.js";
import { UseFormat } from "utils/types.js";
import { buildDesignTokens } from "../tokun.js";

/**
 * Converts a file from one format to another.
 */
export async function build({
  inputs,
  loader,
  formats,
  customValidator,
}: Options) {
  console.info(`Running tokun parse`);
  if (inputs === undefined) {
    throw new Error("No inputs provided for node.");
  }

  console.info(dim(`Paths: ${inputs.join(", ")}`));
  const paths = await glob(inputs);
  if (paths.length === 0) {
    throw new Error(`No files found for ${inputs.join(", ")}`);
  }

  if (typeof loader === "string") {
    loader = findInRegistry(loader, loaderRegistry);
  }

  if (loader.pattern && !paths.some((path) => loader.pattern.test(path))) {
    throw new Error(
      `The parser ${loader.name} does not support the provided files.`,
    );
  }
  const filePromises = paths.map((path) => readFileSync(path, "utf-8"));
  // TODO: known bug - if the same key is in multiple files, the last one will be used.
  const mergedFiles = (await Promise.all(filePromises)).reduce(
    (acc, content) => {
      return assign(acc, JSON.parse(content));
    },
    {},
  );

  // @ts-ignore
  formats = formats.map((format) => {
    if (typeof format.format === "string") {
      format.format = findInRegistry(format.format, formatRegistry);
    }

    if (format.transforms) {
      // @ts-ignore
      format.transforms = format.transforms.map((transform) => {
        if (typeof transform === "string") {
          return findInRegistry(transform, transformRegistry);
        }
        return transform;
      });
    }

    return format as UseFormat;
  });

  const output = buildDesignTokens({
    obj: mergedFiles,
    loader,
    formats: formats as UseFormat[],
    customValidator,
  });
  console.log("Files:");
  for (const { filePath, content } of output) {
    const dirName = path.dirname(filePath);
    if (!existsSync(dirName)) {
      mkdirSync(dirName, { recursive: true });
    }
    writeFileSync(filePath, content);
    console.log(green(`✓ ${filePath}`));
  }
  console.log();
  console.log(green("Files converted successfully.\n"));
}

export * from "../index.js";
