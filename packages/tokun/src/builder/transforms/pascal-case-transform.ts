import { Transform } from "utils/types.js";

export const pascalCaseTransform: Transform = {
  name: "pascal-case",
  type: "name",
  transitive: true,
  transformer: (arg: string) => {
    return pascal(arg);
  },
};

/**
 * Formats the given string in pascal case fashion
 *
 * pascal('hello world') -> 'HelloWorld'
 * pascal('va va boom') -> 'VaVaBoom'
 */
export const pascal = (str: string): string => {
  const parts = str?.split(/[\.\-\s_]/).map((x) => x.toLowerCase()) ?? [];
  if (parts.length === 0) return "";
  return parts
    .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
    .join("");
};
