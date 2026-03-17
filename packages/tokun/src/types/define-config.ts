import { Token } from "types/definitions.js";
import { ValidatorConfig, ValidatorReturn } from "validators/types.js";
import {
  FileHeader,
  Format,
  FormatConfig,
  Loader,
  ModifyProperties,
  Transform,
  TransformGroup,
} from "../utils/types.js";
import { assign } from "../utils/object-utils.js";

/**
 * Define a configuration object for the design token builder.
 * It should be used with CLI.
 *
 * @param config
 * @returns
 */
export const defineConfig = (config: Config) => config;

/**
 * Deep-merge a base config with overrides.
 */
export const extendConfig = (base: Config, overrides: Partial<Config>): Config =>
  assign(base, overrides as Config);

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
    fileHeader?: FileHeader;
  }[];
  config?: FormatConfig;
};

export type PlatformWithoutString = ModifyProperties<
  Platform,
  {
    format: Format;
    transforms: (Transform | TransformGroup)[];
  }
>;
