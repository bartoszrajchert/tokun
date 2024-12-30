import { green, red, yellow } from "kleur/colors";
import { isEqual } from "radash";
import { Token, TokenGroup } from "types/definitions.js";
import {
  isReference,
  isTokenComposite,
  unwrapReference,
} from "utils/helpers.js";
import { FlattenTokens } from "utils/to-flat.js";
import { Loader, Transform, TransformGroup, UseFormat } from "utils/types.js";

import { dtcgValidator } from "validators/dtcg-validator.js";
import { ValidatorConfig } from "validators/types.js";

export function buildDesignTokens({
  obj,
  loader,
  formats,
  customValidator,
}: {
  obj: object;
  loader: Loader;
  formats: UseFormat[];
  customValidator?: ValidatorConfig;
}) {
  const output: {
    filePath: string;
    content: string;
  }[] = [];
  const { errors, warnings } = dtcgValidator(obj, customValidator);
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

  for (const format of formats) {
    const parsedJson = loader.loadFn({
      content: obj as TokenGroup,
    });

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

    const formats = format.files.map((file) => {
      let tokens = transformed;

      if (file.filter) {
        const filteredTokens = new Map(
          [...transformed].filter(([path, token]) => {
            if (file.filter) return file.filter({ token, path });
          }),
        );

        tokens = filteredTokens;
      }

      return {
        filePath: file.output,
        content: format.format.formatter({
          tokens: tokens,
          config: format.config ?? {},
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
