import { hexColorWithAlphaRegex, tokenReferenceRegex } from "utils/regexes.js";
import { describe, expect, it } from "vitest";

describe("Test regexes", () => {
  it.each(["#000000", "#000", "#000000ff", "#000f"])(
    "test hexColorWithAlphaRegex %s",
    (color) => {
      expect(hexColorWithAlphaRegex.test(color)).toBe(true);
    },
  );

  it.each(["#0000000", "#00", "#000000ff0", "#000g"])(
    "test invalid hexColorWithAlphaRegex %s",
    (color) => {
      expect(hexColorWithAlphaRegex.test(color)).toBe(false);
    },
  );

  it.each([
    "{brand.color.core}",
    "{@typography_primitives.Scale 03}",
    "{@typography_primitives.Scale 07}",
  ])("test tokenReferenceRegex %s", (ref) => {
    expect(tokenReferenceRegex.test(ref)).toBe(true);
  });

  it.each(["{brand.color.unknown", "{@typography_primitives.Scale 07"])(
    "test invalid tokenReferenceRegex %s",
    (ref) => {
      expect(tokenReferenceRegex.test(ref)).toBe(false);
    },
  );
});
