import { Format } from "utils/types.js";

/**
 * Simple JSON formatter.
 */
export const flattenJsonFormat: Format = {
  name: "flatten-json",
  formatter: ({ tokens }) => {
    return JSON.stringify(Object.fromEntries(tokens), null, 2);
  },
};
