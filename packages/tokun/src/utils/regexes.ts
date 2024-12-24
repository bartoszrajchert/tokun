/**
 * Regex for token reference.
 *
 * Explanation:
 * - `^` asserts the start of a line.
 * - `\{` matches the character `{` literally.
 * - `[a-zA-Z0-9\s@_-]+` matches any character in the range `a-z`, `A-Z`, `0-9`, whitespace, `@`, `_`, `-` one or more times.
 * - `(?:\.[a-zA-Z0-9\s@_-]+)*` non-capturing group that matches any character in the range `a-z`, `A-Z`, `0-9`, whitespace, `@`, `_`, `-` one or more times, zero or more times.
 * - `\}` matches the character `}` literally.
 * - `$` asserts the end of a line.
 *
 * @example
 * ```ts
 * tokenReferenceRegex.test("{brand.color.core}"); // true
 * tokenReferenceRegex.test("{@typography_primitives.Scale 03}"); // true
 * tokenReferenceRegex.test("{brand.color.unknown"); // false
 * ```
 */
export const tokenReferenceRegex =
  /^\{[a-zA-Z0-9\s@_-]+(?:\.[a-zA-Z0-9\s@_-]+)*\}$/;

/**
 * Regex for hex color with alpha.
 *
 * Explanation:
 * - `#` matches the character `#` literally.
 * - `([A-Fa-f0-9]{3}){1,2}` matches any character in the range `A-F`, `a-f`, or `0-9` three times, one or two times.
 * - `\b` asserts a word boundary.
 * - `|` or.
 * - `#` matches the character `#` literally.
 * - `([A-Fa-f0-9]{4}){1,2}` matches any character in the range `A-F`, `a-f`, or `0-9` four times, one or two times.
 * - `\b` asserts a word boundary.
 *
 * @example
 * ```ts
 * hexColorWithAlphaRegex.test("#000000"); // true
 * hexColorWithAlphaRegex.test("#000"); // true
 * hexColorWithAlphaRegex.test("#000000ff"); // true
 * hexColorWithAlphaRegex.test("#000f"); // true
 * ```
 */
export const hexColorWithAlphaRegex =
  /#([A-Fa-f0-9]{3}){1,2}\b|#([A-Fa-f0-9]{4}){1,2}\b/;
