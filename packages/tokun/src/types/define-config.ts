import type { Token } from "types/definitions.js";
import type { ValidatorConfig, ValidatorReturn } from "validators/types.js";
import type { LogConfig } from "../utils/logger.js";
import type {
  FileHeader,
  Format,
  FormatConfig,
  Loader,
  ModifyProperties,
  Transform,
  TransformGroup,
} from "../utils/types.js";

export type Config = {
  data: string | string[] | object | object[];
  log?: Partial<LogConfig>;
  options?: ConfigOptions;
};

/**
 * Define a configuration object for the design token builder.
 * It should be used with CLI.
 */
export const defineConfig = <T extends Config>(config: T): T => config;

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
