import { capitalize } from "utils/string-utils.js";
import { Transform } from "utils/types.js";

export const kebabCaseTransform: Transform = {
  name: "kebab-case",
  type: "name",
  transformer: (arg: string) => {
    return dash(arg);
  },
};

/**
 * Formats the given string in dash case fashion
 *
 * dash('hello world') -> 'hello-world'
 * dash('va va_VOOM') -> 'va-va-voom'
 * dash('helloWord') -> 'hello-word'
 */
export const dash = (str: string): string => {
  const parts =
    str
      ?.replace(/([A-Z])+/g, capitalize)
      ?.split(/(?=[A-Z])|[\.\-\s_]/)
      .map((x) => x.toLowerCase()) ?? [];
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!;
  return parts.reduce((acc, part) => {
    return `${acc}-${part.toLowerCase()}`;
  });
};
