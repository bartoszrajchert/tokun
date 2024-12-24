import { snake } from "radash";
import { Transform } from "utils/types.js";

export const snakeCaseTransform: Transform = {
  name: "snake-case",
  type: "name",
  transitive: true,
  transformer: (arg: string) => {
    return snake(arg);
  },
};
