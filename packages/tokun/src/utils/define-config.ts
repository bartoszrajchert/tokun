import { Validators } from "validators/tokens-validator.js";
import {
  Format,
  Loader,
  ModifyProperties,
  Transform,
  TransformGroup,
  UseFormat,
} from "./types.js";

export const defineConfig = (options: Options) => options;

export type Options = {
  inputs: string[];
  loader: Loader | string;
  // TODO: merge it with the core type
  formats: ModifyProperties<
    UseFormat,
    {
      format?: string | Format;
      transforms?: (string | Transform | TransformGroup)[];
    }
  >[];
  customValidator?: Validators;
};
