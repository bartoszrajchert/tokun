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
 * Converts an object to a file.
 *
 * @param loader The loader to use.
 * @param formats The formats to convert to.
 * @param customValidator The custom validator to use.
 * @param obj The object to convert.
 * @returns The converted files.
 */
export function build({
  loader,
  formats,
  customValidator,
  obj,
}: Omit<Options, "inputs"> & { obj: object }) {
  if (obj === undefined) {
    throw new Error("No object provided for browser.");
  }

  if (typeof loader === "string") {
    loader = findInRegistry(loader, loaderRegistry);
  }

  formats = formats.map((format) => {
    if (typeof format.format === "string") {
      format.format = findInRegistry(format.format, formatRegistry);
    }

    if (format.transforms) {
      format.transforms = format.transforms.map((transform) => {
        if (typeof transform === "string") {
          return findInRegistry(transform, transformRegistry);
        }
        return transform;
      });
    }

    return format as UseFormat;
  });

  return buildDesignTokens({
    obj,
    loader,
    formats: formats as UseFormat[],
    customValidator,
  });
}

export * from "../index.js";
