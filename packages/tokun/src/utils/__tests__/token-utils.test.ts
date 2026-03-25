import {
  hexColorWithAlphaRegex,
  normalizeRootTokenPath,
  pointerToTokenPath,
  tokenReferenceRegex,
} from "utils/token-utils.js";
import { describe, expect, it } from "vitest";

describe("Test regexes", () => {
  it.each(["#000000"])("test hexColorWithAlphaRegex %s", (color) => {
    expect(hexColorWithAlphaRegex.test(color)).toBe(true);
  });

  it.each([
    "#000",
    "#000000ff",
    "#000f",
    "#0000000",
    "#00",
    "#000000ff0",
    "#000g",
  ])("test invalid hexColorWithAlphaRegex %s", (color) => {
    expect(hexColorWithAlphaRegex.test(color)).toBe(false);
  });

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

  it.each([
    ["$root", ""],
    ["brand.color.$root", "brand.color"],
    ["brand.color.white", "brand.color.white"],
  ])("normalizes root token path %s", (input, output) => {
    expect(normalizeRootTokenPath(input)).toBe(output);
  });

  it.each([
    ["#/$root", ""],
    ["#/brand/color/$root", "brand.color"],
    ["#/brand/color/$value", "brand.color"],
    ["#/brand/color/$root/$value/components/0", "brand.color"],
  ])("maps JSON Pointer %s to flattened token path", (pointer, tokenPath) => {
    expect(pointerToTokenPath(pointer as `#/${string}`)).toBe(tokenPath);
  });
});
