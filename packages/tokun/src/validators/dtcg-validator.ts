import { FlattenTokens, toFlat } from "utils/to-flat.js";
import {
  getTokenValue,
  hasUnallowedCharactersInName,
  isReference,
  normalizeRootTokenPath,
  unwrapReference,
} from "utils/token-utils.js";
import { traverseTokens } from "utils/traverse-tokens.js";
import { TokenGroup, TokenType } from "../types/definitions.js";
import { GroupSchema, dtcgJsonSchemas } from "./schemas.js";
import {
  RuleValidators,
  TypeValidators,
  ValidatorConfig,
  ValidatorError,
  ValidatorReturn,
} from "./types.js";

/**
 * Validate the token group.
 * The function checks if the token group is valid and if the references are correct.
 *
 * @param value Unknown value to validate
 * @param config Validator to use
 * @returns True if the value is a valid token group
 */
export function dtcgValidator(
  value: unknown,
  config: ValidatorConfig = {},
): ValidatorReturn {
  const { types, rules } = config;
  const { errors: groupErrors } = validateGroup(value, types);
  if (groupErrors.length > 0) {
    return {
      errors: groupErrors,
      warnings: [],
    };
  }

  const { flatten } = toFlat(value as TokenGroup);

  const { errors: refErrors } = validateRules(flatten, rules);
  if (refErrors.length > 0) {
    return {
      errors: refErrors,
      warnings: [],
    };
  }

  return {
    errors: [],
    warnings: [],
  };
}

/**
 * Validate the token group.
 *
 * @param value Possible token group to validate
 * @param customTypes Custom token types to validate
 * @returns Errors found during the validation. If the array is empty, the token group is valid.
 */
function validateGroup(
  value: unknown,
  customTypes: TypeValidators = {},
): {
  errors: ValidatorError[];
} {
  const mapTypeWithSchema: TypeValidators = {
    ...dtcgJsonSchemas,
    ...customTypes,
  };

  const errors: ValidatorError[] = [];

  traverseTokens(value, {
    onToken: (token, path, lastType) => {
      if (lastType === undefined) {
        errors.push({
          message: `The token at ${path} does not have a type. Please add a type.`,
          name: "missingTokenType",
          path,
        });
        return;
      }

      const schema = mapTypeWithSchema[lastType as TokenType];
      if (!schema) {
        errors.push({
          message: `Invalid token type at ${path}. The type is: ${lastType}`,
          name: "invalidTokenType",
          path,
          value: lastType,
        });
        return;
      }

      const result = schema.validator(token);
      if (!result) {
        errors.push({
          message: `Invalid token value at ${path} (${lastType}). The value is: ${JSON.stringify(getTokenValue(token))}`,
          name: "invalidTokenValue",
          path,
          value: lastType,
        });
      }
    },
    onGroup: (group, path) => {
      const schema = GroupSchema(Object.keys(customTypes));
      const result = schema.safeParse(group);

      if (!result.success) {
        errors.push({
          message: `Invalid group at ${path}. Please check the group properties.`,
          name: "invalidGroup",
          path,
        });
        return;
      }

      for (const key of Object.keys(group)) {
        if (key.startsWith("$")) {
          continue;
        }

        if (hasUnallowedCharactersInName(key)) {
          errors.push({
            message: `Invalid token/group name "${key}" at ${path}`,
            name: "invalidName",
            path: path ? `${path}.${key}` : key,
            value: key,
          });
        }
      }
    },
  });

  return {
    errors,
  };
}

/**
 * Validate the references in the token group.
 * The function checks if the reference exists and has the same type.
 *
 * @param tokenGroup - The token group to validate.
 */
function validateRules(
  flatten: FlattenTokens,
  customRules: RuleValidators = [],
): { errors: ValidatorError[] } {
  const finalErrors: ValidatorError[] = [];

  const alleRules: RuleValidators = [
    (tokens) => isReferencedTokenExists(tokens),
    (tokens) => hasSameType(tokens),
    ...customRules,
  ];

  alleRules.forEach((rule) => {
    const { errors } = rule(flatten);
    if (errors.length > 0) {
      finalErrors.push(...errors);
    }
  });

  return {
    errors: finalErrors,
  };
}

type CollectedReference = {
  value: string;
  path: string;
};

function collectReferences(
  value: unknown,
  path: string,
  output: CollectedReference[],
) {
  if (isReference(value)) {
    output.push({ value, path });
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectReferences(entry, `${path}[${index}]`, output);
    });
    return;
  }

  if (typeof value === "object" && value !== null) {
    Object.entries(value).forEach(([key, nestedValue]) => {
      collectReferences(nestedValue, `${path}.${key}`, output);
    });
  }
}

function isReferencedTokenExists(flatten: FlattenTokens): {
  errors: ValidatorError[];
} {
  const errors: ValidatorError[] = [];

  flatten.forEach((token, key) => {
    const references: CollectedReference[] = [];
    collectReferences(getTokenValue(token), key, references);

    references.forEach((reference) => {
      const resolvedPath = normalizeRootTokenPath(
        unwrapReference(reference.value),
      );

      if (!flatten.has(resolvedPath)) {
        errors.push({
          message: `The reference "${reference.value}" does not exist in "${reference.path}"`,
          name: "referenceNotFound",
          path: reference.path,
          value: reference.value,
        });
      }
    });
  });

  return { errors };
}

function hasSameType(flatten: FlattenTokens): { errors: ValidatorError[] } {
  const errors: ValidatorError[] = [];

  flatten.forEach((token, key) => {
    const { $type: type } = token;
    const tokenValue = getTokenValue(token);

    let referencedToken;

    if (isReference(tokenValue)) {
      referencedToken = flatten.get(
        normalizeRootTokenPath(unwrapReference(tokenValue)),
      );
    }

    if (!referencedToken || !type) {
      return;
    }

    if (referencedToken.$type !== type) {
      errors.push({
        message: `The reference must have the same type. Got "${referencedToken.$type}" but expected "${type}" in ${key}`,
        name: "referenceTypeMismatch",
        path: key,
        value: { expected: type, got: referencedToken.$type },
      });
    }
  });

  return { errors };
}
