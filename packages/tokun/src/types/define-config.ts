import { Token } from "types/definitions.js";
import { FlattenTokens } from "utils/to-flat.js";
import { ValidatorConfig, ValidatorReturn } from "validators/types.js";
import {
  Format,
  Loader,
  ModifyProperties,
  Transform,
  TransformGroup,
} from "../utils/types.js";

/**
 * Define a configuration object for the design token builder.
 * It should be used with CLI.
 *
 * @param config
 * @returns
 */
export const defineConfig = (config: Config) => config;

export type Config = {
  data: string | string[] | object | object[];
  options?: ConfigOptions;
};

export type ConfigOptions = {
  loader: Loader | string;
  platforms: Platform[];
  validator?: (value: unknown, config?: ValidatorConfig) => ValidatorReturn;
  customValidator?: ValidatorConfig;
};

export type Platform = {
  name: string;
  format: Format | string;
  transforms?: (string | Transform | TransformGroup)[];
  outputs: {
    name: string;
    filter?: ({ token, path }: { token: Token; path: string }) => boolean;
  }[];
  config?: any;
};

export type PlatformWithoutString = ModifyProperties<
  Platform,
  {
    format: Format;
    transforms: (Transform | TransformGroup)[];
  }
>;
