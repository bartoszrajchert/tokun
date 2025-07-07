import {
  Config,
  ConfigOptions,
  PlatformWithoutString,
} from "types/define-config.js";
import { Token, TokenGroup, TokenType, TokenValue } from "types/definitions.js";
import { logger } from "utils/logger.js";
import { assign, isEqual } from "utils/object-utils.js";
import {
  formatRegistry,
  loaderRegistry,
  transformRegistry,
} from "utils/registry.js";
import { FlattenTokens } from "utils/to-flat.js";
import {
  findInRegistry,
  isReference,
  isTokenComposite,
  unwrapReference,
} from "utils/token-utils.js";
import { Loader, Transform, TransformGroup } from "utils/types.js";
import { defaultFileHeader } from "./file-headers/default-file-header.js";
import { cssFormat } from "./formats/css-format.js";
import { dtcgJsonLoader } from "./loaders/dtcg-json-loader.js";
import { cssTransforms } from "./transforms/index.js";

type BuildOutput = {
  name: string;
  content: string;
};

type TokenTransformer = {
  (value: string): string;
  (token: Token): Token;
};

/**
 * Build design tokens.
 *
 * @param config Configuration object.
 * @returns Array of objects with name and content properties.
 */
export function build(config: Config): BuildOutput[] {
  const { data, options } = config;

  if (!data) {
    throw new Error("Please provide data.");
  }

  const mergedData = dataToObject(data);

  if (!options) {
    return buildDesignTokens({
      obj: dtcgJsonLoader.loadFn({ content: mergedData }),
      platforms: [
        {
          name: "css",
          format: cssFormat,
          transforms: [cssTransforms],
          outputs: [{ name: "output.css" }],
        },
      ],
    });
  }

  const { loader, platforms, validator, customValidator } = options;

  const resolvedLoader = resolveLoader(loader);
  const resolvedPlatforms = resolvePlatforms(platforms);

  if (validator) {
    validateTokens(mergedData, validator, customValidator);
  }

  return buildDesignTokens({
    obj: resolvedLoader.loadFn({ content: mergedData }),
    platforms: resolvedPlatforms,
  });
}

function resolvePlatforms(
  platforms: ConfigOptions["platforms"],
): PlatformWithoutString[] {
  return platforms.map((platform) => ({
    ...platform,
    format:
      typeof platform.format === "string"
        ? findInRegistry(platform.format, formatRegistry)
        : platform.format,
    transforms:
      platform.transforms?.map((transform) =>
        typeof transform === "string"
          ? findInRegistry(transform, transformRegistry)
          : transform,
      ) ?? [],
  }));
}

function resolveLoader(loader: ConfigOptions["loader"]): Loader {
  return typeof loader === "string"
    ? findInRegistry(loader, loaderRegistry)
    : loader;
}

function validateTokens(
  data: TokenGroup,
  validator: NonNullable<ConfigOptions["validator"]>,
  customValidator?: ConfigOptions["customValidator"],
): void {
  const { errors, warnings } = validator(data, customValidator);

  if (errors.length > 0) {
    errors.forEach(({ message }) => logger.error(`! ${message}`));
    throw new Error("Provided content is not a valid token group.");
  }

  if (warnings.length > 0) {
    const uniqueWarnings = Array.from(new Set(warnings));
    uniqueWarnings.forEach((message) => logger.warn(message));
  }
}

function dataToObject(data: Config["data"]): TokenGroup {
  if (typeof data === "string") {
    return JSON.parse(data);
  }

  if (Array.isArray(data)) {
    const parsedData = data.map((d) =>
      typeof d === "string" ? JSON.parse(d) : d,
    );
    return parsedData.reduce(
      (acc, content) => assign(acc, content),
      {} as TokenGroup,
    );
  }

  return data as TokenGroup;
}

function buildDesignTokens({
  obj,
  platforms,
}: {
  obj: FlattenTokens;
  platforms: PlatformWithoutString[];
}): BuildOutput[] {
  const output: BuildOutput[] = [];

  for (const format of platforms) {
    const transformedTokens = applyTransforms(obj, format.transforms);
    const formats = generateFormats(transformedTokens, format);

    logger.success(`✓ ${format.format.name} format parsed`);
    output.push(...formats);
  }

  logger.break();
  return output;
}

function applyTransforms(
  tokens: FlattenTokens,
  transforms?: (Transform | TransformGroup)[],
): FlattenTokens {
  if (!transforms) return tokens;

  return transforms.reduce((acc, transform) => {
    acc.forEach((token, name) => {
      if (isTransformGroup(transform)) {
        transform.transforms.forEach((t) =>
          transformToken({
            transform: t,
            token,
            tokenName: name,
            flattenTokens: acc,
          }),
        );
        return;
      }
      transformToken({ transform, token, tokenName: name, flattenTokens: acc });
    });
    return acc;
  }, tokens);
}

function generateFormats(
  tokens: FlattenTokens,
  format: PlatformWithoutString,
): BuildOutput[] {
  return format.outputs.map((output) => {
    const filteredTokens = output.filter
      ? new Map(
          [...tokens].filter(([path, token]) =>
            output.filter?.({ token, path }),
          ),
        )
      : tokens;

    return {
      name: output.name,
      content: format.format.formatter({
        tokens: filteredTokens,
        config: format.config ?? {},
        fileHeader: output.fileHeader ?? defaultFileHeader,
      }),
    };
  });
}

const isTransformGroup = (
  arg: Transform | TransformGroup,
): arg is TransformGroup => arg.hasOwnProperty("transforms");

function transformToken(args: {
  transform: Transform;
  token: Token;
  tokenName: string;
  flattenTokens: FlattenTokens;
}): void {
  const { transform, token, tokenName: name, flattenTokens: acc } = args;

  if (transform.filter && !transform.filter(token)) return;

  if (transform.type === "name") {
    handleNameTransform(transform, token, name, acc);
  } else if (transform.type === "token") {
    handleTokenTransform(transform, token, name, acc);
  }
}

function handleNameTransform(
  transform: Transform,
  token: Token,
  name: string,
  acc: FlattenTokens,
): void {
  if (!token.$type) {
    logger.error(`! Token ${name} has no type`);
    throw new Error(`Token ${name} has no type`);
  }

  const transformedName = transform.transformer(name as Token & string);
  const transformedValue = transformReferenceValue(
    token.$value,
    token.$type,
    transform.transformer as TokenTransformer,
  );

  if (!isEqual(transformedValue, token.$value)) {
    token.$value = transformedValue as TokenValue;
  }

  if (transformedName !== name) {
    acc.set(transformedName as string, token);
    acc.delete(name);
  }
}

function handleTokenTransform(
  transform: Transform,
  token: Token,
  name: string,
  acc: FlattenTokens,
): void {
  const transformedToken = transform.transformer(token as Token & string);
  if (!isEqual(transformedToken, token)) {
    acc.set(name, transformedToken as Token);
  }
}

function transformReferenceValue(
  value: unknown,
  type: TokenType,
  transformer: TokenTransformer,
): unknown {
  if (isReference(value)) {
    const transformedValue = transformer(unwrapReference(value));
    return transformedValue !== value ? `{${transformedValue}}` : value;
  }

  if (Array.isArray(value) && isTokenComposite({ $type: type } as Token)) {
    return value.map((v) =>
      isReference(v)
        ? `{${transformer(unwrapReference(v))}}`
        : transformCompositeValue(v, type, transformer),
    );
  } else if (Array.isArray(value)) {
    return value.map((v) =>
      isReference(v) ? `{${transformer(unwrapReference(v))}}` : v,
    );
  }

  if (
    !Array.isArray(value) &&
    typeof value === "object" &&
    value !== null &&
    isTokenComposite({ $type: type } as Token)
  ) {
    return transformCompositeValue(value, type, transformer);
  }

  return value;
}

function transformCompositeValue(
  value: object,
  type: TokenType,
  transformer: TokenTransformer,
): object {
  return Object.entries(value as Record<string, unknown>).reduce(
    (acc, [key, val]) => ({
      ...acc,
      [key]: transformReferenceValue(val, type, transformer),
    }),
    {} as Record<string, unknown>,
  );
}
