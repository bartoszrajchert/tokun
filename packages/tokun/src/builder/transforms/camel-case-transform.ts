import { camel } from "radash";
import { Transform } from "utils/types.js";

export const camelCaseTransform: Transform = {
  name: "camel-case",
  type: "name",
  transitive: true,
  transformer: (arg: string) => {
    return camel(arg);
  },
};
