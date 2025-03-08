import { green, red, yellow } from "kleur/colors";
import { assign, isEqual } from "radash";
import { Config, PlatformWithoutString } from "types/define-config.js";
import { Token } from "types/definitions.js";
import {
  findInRegistry,
  isReference,
  isTokenComposite,
  unwrapReference,
} from "utils/helpers.js";
import {
  formatRegistry,
  loaderRegistry,
  transformRegistry,
} from "utils/registry.js";
import { FlattenTokens } from "utils/to-flat.js";
import { Transform, TransformGroup } from "utils/types.js";

import { defaultFileHeader } from "./file-headers/default-file-header.js";
import { cssFormat } from "./formats/css-format.js";
import { dtcgJsonLoader } from "./loaders/dtcg-json-loader.js";
import { cssTransforms } from "./transforms/index.js";

/**
 * Build design tokens.
 *
 * @param config Configuration object.
 * @returns Array of objects with name and content properties.
 */
export function build(config: Config) {
  const { data, options } = config;

  if (data === undefined) {
    throw new Error("Provide data.");
  }

  const mergedData = dataToObject(data);

  // Default build.
  if (options === undefined) {
    return buildDesignTokens({
      obj: dtcgJsonLoader.loadFn({ content: mergedData }),
      // TODO: think if this is not useful
      // validator: dtcgValidator,
      platforms: [
        {
          name: "css",
          format: cssFormat,
          transforms: [cssTransforms],
          outputs: [
            {
              name: "output.css",
            },
          ],
        },
      ],
    });
  }

  let { loader, platforms, validator, customValidator } = options;

  if (typeof loader === "string") {
    loader = findInRegistry(loader, loaderRegistry);
  }

  platforms = platforms.map((platform) => {
    if (typeof platform.format === "string") {
      platform.format = findInRegistry(platform.format, formatRegistry);
    }

    if (platform.transforms) {
      platform.transforms = platform.transforms.map((transform) => {
        if (typeof transform === "string") {
          return findInRegistry(transform, transformRegistry);
        }
        return transform;
      });
    }

    return platform;
  });

  if (validator) {
    const { errors, warnings } = validator(mergedData, customValidator);

    if (errors.length > 0) {
      errors.forEach(({ message }) => {
        console.error(red(`! ${message}`));
      });
      throw new Error("Provided content is not a valid token group.");
    }

    if (warnings.length > 0) {
      const uniqueWarnings = Array.from(new Set(warnings));
      uniqueWarnings.forEach((message) => {
        console.warn(yellow(message));
      });
    }
  }

  return buildDesignTokens({
    obj: loader.loadFn({ content: mergedData }),
    platforms: platforms as PlatformWithoutString[],
  });
}

function dataToObject(data: Config["data"]) {
  if (typeof data === "string") {
    JSON.parse(data);
  }

  if (Array.isArray(data)) {
    const parsedData = (data as object[] | string[]).map((d) => {
      return typeof d === "string" ? JSON.parse(d) : d;
    });

    return parsedData.reduce((acc, content) => {
      return assign(acc, content);
    }, {});
  }

  return data;
}

function buildDesignTokens({
  obj,
  platforms,
}: {
  obj: FlattenTokens;
  platforms: PlatformWithoutString[];
}) {
  const output: {
    name: string;
    content: string;
  }[] = [];

  for (const format of platforms) {
    const parsedJson = obj;

    const transformed = format.transforms
      ? format.transforms.reduce((acc, transform) => {
          acc.forEach((token, name) => {
            if (isTransformGroup(transform)) {
              transform.transforms.forEach((transform) => {
                transformToken({
                  transform: transform,
                  token: token,
                  tokenName: name,
                  flattenTokens: acc,
                });
              });

              return acc;
            }

            transformToken({
              transform: transform,
              token: token,
              tokenName: name,
              flattenTokens: acc,
            });
          });

          return acc;
        }, parsedJson)
      : parsedJson;

    const formats = format.outputs.map((output) => {
      let tokens = transformed;

      if (output.filter) {
        const filteredTokens = new Map(
          [...transformed].filter(([path, token]) => {
            if (output.filter) return output.filter({ token, path });
          }),
        );

        tokens = filteredTokens;
      }

      return {
        name: output.name,
        content: format.format.formatter({
          tokens: tokens,
          config: format.config ?? {},
          fileHeader: output.fileHeader ?? defaultFileHeader,
        }),
      };
    });

    console.log(green(`✓ ${format.format.name} format parsed`));
    output.push(...formats);
  }

  console.log();

  return output;
}

const isTransformGroup = (
  arg: Transform | TransformGroup,
): arg is TransformGroup => {
  return arg.hasOwnProperty("transforms");
};

const transformToken = ({
  transform,
  token,
  tokenName: name,
  flattenTokens: acc,
}: {
  transform: Transform;
  token: Token;
  tokenName: string;
  flattenTokens: FlattenTokens;
}) => {
  if (transform.filter && !transform.filter(token)) {
    // If the token is filtered out, skip it.
    return;
  }

  if (transform.type === "name") {
    const transformedName = transform.transformer(name);

    const transformedReferenceValue = (value: unknown) => {
      if (isReference(value)) {
        const transformedValue = transform.transformer(unwrapReference(value));
        if (transformedValue !== value) {
          return `{${transformedValue}}`;
        }
      }

      return value;
    };

    const transformCompositeValue = (value: object) => {
      return Object.entries(value).reduce((acc, [key, value]) => {
        return {
          ...acc,
          [key]: transformedReferenceValue(value),
        };
      }, {} as any);
    };

    if (isReference(token.$value)) {
      const transformedValue = transform.transformer(
        unwrapReference(token.$value),
      );

      if (transformedValue !== token.$value) {
        token.$value = `{${transformedValue}}`;
      }
    }

    if (
      !Array.isArray(token.$value) &&
      typeof token.$value === "object" &&
      isTokenComposite(token)
    ) {
      const transformedValue = Object.entries(token.$value).reduce(
        (acc, [key, value]) => {
          return {
            ...acc,
            [key]: isReference(value)
              ? `{${transform.transformer(unwrapReference(value))}}`
              : value,
          };
        },
        {} as any,
      );

      if (!isEqual(transformedValue, token.$value)) {
        token.$value = transformedValue;
      }
    }

    if (Array.isArray(token.$value) && isTokenComposite(token)) {
      const transformedValue = token.$value.map((value) =>
        isReference(value)
          ? `{${transform.transformer(unwrapReference(value))}}`
          : transformCompositeValue(value),
      );

      if (!isEqual(transformedValue, token.$value)) {
        token.$value = transformedValue;
      }
    }

    if (transformedName !== name) {
      acc.set(transformedName, token);
      acc.delete(name);
    }
  }

  if (transform.type === "token") {
    const transformedToken = transform.transformer(token);

    if (!isEqual(transformedToken, token)) {
      acc.set(name, transformedToken);
    }
  }
};
