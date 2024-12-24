import { TokenGroup } from "types/definitions.js";
import { describe, expect, it, vi } from "vitest";
import { traverseTokens } from "../../src/utils/traverse-tokens.js";

describe("traverseTokens", () => {
  it("should call onToken for each token", () => {
    const onToken = vi.fn();
    const onGroup = vi.fn();
    const tokens: TokenGroup = {
      token1: { $type: "color", $value: "#fff" },
      group1: {
        token2: { $type: "color", $value: "#000" },
      },
    };

    traverseTokens(tokens, { onToken, onGroup });

    expect(onToken).toHaveBeenCalledTimes(2);
    expect(onToken).toHaveBeenCalledWith(
      { $type: "color", $value: "#fff" },
      "token1",
      "color",
      undefined,
    );
    expect(onToken).toHaveBeenCalledWith(
      { $type: "color", $value: "#000" },
      "group1.token2",
      "color",
      undefined,
    );
  });

  it("should handle tokens without the name", () => {
    const onToken = vi.fn();
    const onGroup = vi.fn();
    const tokens: TokenGroup = {
      token1: {
        "": { $type: "color", $value: "#fff" },
        token11: { $type: "color", $value: "#000" },
      },
      token2: { $type: "color", $value: "#000" },
    };

    traverseTokens(tokens, { onToken, onGroup });

    expect(onToken).toHaveBeenCalledTimes(3);
    expect(onToken).toHaveBeenCalledWith(
      { $type: "color", $value: "#fff" },
      "token1",
      "color",
      undefined,
    );
  });

  it("should call onGroup for each group", () => {
    const onToken = vi.fn();
    const onGroup = vi.fn();
    const tokens: TokenGroup = {
      group1: {
        token1: { $type: "color", $value: "#fff" },
        group2: {
          token2: { $type: "color", $value: "#000" },
        },
      },
    };

    traverseTokens(tokens, { onToken, onGroup });

    expect(onGroup).toHaveBeenCalledTimes(3); // root + 2 groups
    expect(onGroup).toHaveBeenCalledWith(tokens.group1, "group1");
    expect(onGroup).toHaveBeenCalledWith(
      (tokens.group1 as TokenGroup).group2,
      "group1.group2",
    );
  });

  it("should throw an error for non-object values", () => {
    const onToken = vi.fn();
    const onGroup = vi.fn();
    const tokens: any = {
      invalid: "string value",
    };

    expect(() => traverseTokens(tokens, { onToken, onGroup })).toThrowError();
  });

  it("should handle nested groups and tokens correctly", () => {
    const onToken = vi.fn();
    const onGroup = vi.fn();
    const tokens: TokenGroup = {
      group1: {
        $description: "Group 1",
        token1: { $type: "color", $value: "#fff" },
        group2: {
          $extensions: { extension: "ext" },
          token2: { $type: "color", $value: "#000" },
        },
      },
    };

    traverseTokens(tokens, { onToken, onGroup });

    expect(onToken).toHaveBeenCalledTimes(2);
    expect(onToken).toHaveBeenCalledWith(
      { $type: "color", $value: "#fff" },
      "group1.token1",
      "color",
      { $description: "Group 1" },
    );
    expect(onToken).toHaveBeenCalledWith(
      { $type: "color", $value: "#000" },
      "group1.group2.token2",
      "color",
      { $extensions: { extension: "ext" } },
    );

    expect(onGroup).toHaveBeenCalledTimes(3); // root + 2 groups
    expect(onGroup).toHaveBeenCalledWith(tokens.group1, "group1");
    expect(onGroup).toHaveBeenCalledWith(
      (tokens.group1 as TokenGroup).group2,
      "group1.group2",
    );
  });
});
