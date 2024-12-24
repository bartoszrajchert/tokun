import { dash } from "radash";
import { Transform } from "utils/types.js";

export const kebabCaseTransform: Transform = {
  name: "kebab-case",
  type: "name",
  transitive: true,
  transformer: (arg: string) => {
    return dash(arg);
  },
};
