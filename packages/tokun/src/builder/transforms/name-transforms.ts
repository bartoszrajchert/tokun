import { capitalize } from "utils/string-utils.js";
import { Transform } from "utils/types.js";

function toCaseParts(value: string): string[] {
  return value
    .replace(/([A-Z])+/g, capitalize)
    .split(/(?=[A-Z])|[\.\-\s_]/)
    .map((part) => part.toLowerCase());
}

/**
 * Formats the given string in camel case fashion
 *
 * camel('hello world') -> 'helloWorld'
 * camel('va va-VOOM') -> 'vaVaVoom'
 * camel('helloWorld') -> 'helloWorld'
 */
export const camelCaseTransform: Transform = {
  name: "camel-case",
  type: "name",
  transformer: (arg: string) => {
    const parts = toCaseParts(arg);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0]!;
    return parts.reduce((acc, part) => {
      return `${acc}${part.charAt(0).toUpperCase()}${part.slice(1)}`;
    });
  },
};

/**
 * Formats the given string in dash case fashion
 *
 * dash('hello world') -> 'hello-world'
 * dash('va va_VOOM') -> 'va-va-voom'
 * dash('helloWord') -> 'hello-word'
 */
export const kebabCaseTransform: Transform = {
  name: "kebab-case",
  type: "name",
  transformer: (arg: string) => {
    const parts = toCaseParts(arg);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0]!;
    return parts.reduce((acc, part) => {
      return `${acc}-${part.toLowerCase()}`;
    });
  },
};

/**
 * Formats the given string in pascal case fashion
 *
 * pascal('hello world') -> 'HelloWorld'
 * pascal('va va boom') -> 'VaVaBoom'
 */
export const pascalCaseTransform: Transform = {
  name: "pascal-case",
  type: "name",
  transformer: (arg: string) => {
    const parts = arg?.split(/[\.\-\s_]/).map((x) => x.toLowerCase()) ?? [];
    if (parts.length === 0) return "";
    return parts
      .map((str) => str.charAt(0).toUpperCase() + str.slice(1))
      .join("");
  },
};

/**
 * Formats the given string in snake case fashion
 *
 * snake('hello world') -> 'hello_world'
 * snake('va va-VOOM') -> 'va_va_voom'
 * snake('helloWord') -> 'hello_world'
 */
export const snakeCaseTransform: Transform = {
  name: "snake-case",
  type: "name",
  transformer: (arg: string) => {
    const parts = toCaseParts(arg);
    if (parts.length === 0) return "";
    if (parts.length === 1) return parts[0]!;
    const result = parts.reduce((acc, part) => {
      return `${acc}_${part.toLowerCase()}`;
    });
    return result;
  },
};
