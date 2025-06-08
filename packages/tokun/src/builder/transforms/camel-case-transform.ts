import { capitalize } from "utils/string-utils.js";
import { Transform } from "utils/types.js";

export const camelCaseTransform: Transform = {
  name: "camel-case",
  type: "name",
  transformer: (arg: string) => {
    return camel(arg);
  },
};

/**
 * Formats the given string in camel case fashion
 *
 * camel('hello world') -> 'helloWorld'
 * camel('va va-VOOM') -> 'vaVaVoom'
 * camel('helloWorld') -> 'helloWorld'
 */
export const camel = (str: string): string => {
  const parts =
    str
      ?.replace(/([A-Z])+/g, capitalize)
      ?.split(/(?=[A-Z])|[\.\-\s_]/)
      .map((x) => x.toLowerCase()) ?? [];
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!;
  return parts.reduce((acc, part) => {
    return `${acc}${part.charAt(0).toUpperCase()}${part.slice(1)}`;
  });
};
