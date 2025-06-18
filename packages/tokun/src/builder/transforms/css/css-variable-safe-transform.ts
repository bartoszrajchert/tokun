import { Transform } from "utils/types.js";

export const cssVariableSafeTransform: Transform = {
  name: "css-variable-safe",
  type: "name",
  transformer: (arg: string) => {
    return arg.replace(/[^a-zA-Z0-9-_]/g, "");
  },
};
