import { FlattenTokens, toFlat } from "utils/to-flat.js";
import { isReference, unwrapReference } from "utils/token-utils.js";
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
          message: `Invalid token value at ${path} (${lastType}). The value is: ${JSON.stringify(token.$value)}`,
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
    isReferencedTokenExists,
    hasSameType,
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

function isReferencedTokenExists(flatten: FlattenTokens): {
  errors: ValidatorError[];
} {
  const errors: ValidatorError[] = [];

  flatten.forEach(({ $value: value }, key) => {
    if (isReference(value)) {
      const reference = unwrapReference(value);

      if (!flatten.has(reference)) {
        errors.push({
          message: `The reference "${value}" does not exist in "${key}"`,
          name: "referenceNotFound",
          path: key,
          value: value,
        });
        return;
      }
    }

    if (Array.isArray(value)) {
      value.forEach((val, index) => {
        if (isReference(val)) {
          const reference = unwrapReference(val);

          if (!flatten.has(reference)) {
            errors.push({
              message: `The reference "${val}" does not exist in "${key}[${index}]"`,
              name: "referenceNotFound",
              path: `${key}[${index}]`,
              value: val,
            });
          }
        }
      });

      return;
    }

    if (typeof value === "object") {
      Object.entries(value).forEach(([property, val]) => {
        if (isReference(val)) {
          const reference = unwrapReference(val);

          if (!flatten.has(reference)) {
            errors.push({
              message: `The reference "${val}" does not exist in "${key}", property "${property}"`,
              name: "referenceNotFound",
              path: `${key}.${property}`,
              value: val,
            });
          }
        }

        if (Array.isArray(val)) {
          val.forEach((v, index) => {
            if (isReference(v)) {
              const reference = unwrapReference(v);

              if (!flatten.has(reference)) {
                errors.push({
                  message: `The reference "${v}" does not exist in "${key}", property "${property}[${index}]"`,
                  name: "referenceNotFound",
                  path: `${key}.${property}[${index}]`,
                  value: v,
                });
              }
            }
          });
        }
      });
      return;
    }
  });

  return { errors };
}

function hasSameType(flatten: FlattenTokens): { errors: ValidatorError[] } {
  const errors: ValidatorError[] = [];

  flatten.forEach(({ $value: value, $type: type }, key) => {
    if (isReference(value)) {
      const referencedToken = flatten.get(unwrapReference(value));
      if (!referencedToken) return;

      if (referencedToken.$type !== type) {
        errors.push({
          message: `The reference "${value}" must have the same type. Got "${referencedToken?.$type}" but expected "${type} in ${key}"`,
          name: "referenceTypeMismatch",
          path: key,
          value: { expected: type, got: referencedToken.$type },
        });
        return;
      }
    }
  });

  return { errors };
}
