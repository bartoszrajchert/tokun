import { pascal } from "radash";
import { Transform } from "utils/types.js";

export const pascalCaseTransform: Transform = {
  name: "pascal-case",
  type: "name",
  transitive: true,
  transformer: (arg: string) => {
    return pascal(arg);
  },
};
