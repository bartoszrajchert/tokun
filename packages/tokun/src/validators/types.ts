import { Token } from "types/definitions.js";
import { FlattenTokens } from "utils/to-flat.js";

export type TypeValidators = {
  [key: string]: {
    validator: (token: Token) => boolean;
  };
};

export type RuleValidators = ((flatten: FlattenTokens) => {
  errors: ValidatorError[];
})[];

export type ValidatorConfig = {
  types?: TypeValidators;
  rules?: RuleValidators;
};

export type ValidatorError = {
  name: string;
  message: string;
  path: string;
  value?: unknown;
};

export type ValidatorReturn = { errors: ValidatorError[]; warnings: string[] };
