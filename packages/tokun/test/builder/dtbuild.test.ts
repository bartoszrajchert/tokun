import { build } from "builder/tokun.js";
import { Platform } from "types/define-config.js";
import { Loader } from "utils/types.js";
import { dtcgValidator } from "validators/dtcg-validator.js";
import { describe, expect, it, vi } from "vitest";

describe("parseDesignTokens", () => {
  const mockParser: Loader = {
    name: "test",
    loadFn: vi.fn().mockReturnValue(new Map()),
    pattern: /\.json$/,
  };

  const mockPlatform: Platform = {
    format: {
      name: "testFormat",
      formatter: vi.fn().mockReturnValue("formatted"),
    },
    outputs: [{ name: "test.json" }],
    name: "testPlatform",
  };

  it("should validate tokens and throw error for invalid content", () => {
    const invalidObj = { invalid: "content" };

    expect(() =>
      build({
        data: invalidObj,
        options: {
          validator: dtcgValidator,
          loader: mockParser,
          platforms: [mockPlatform],
        },
      }),
    ).toThrowError();
  });

  it("should parse and format valid tokens", () => {
    const validObj = {
      $type: "color",
      tokens: {},
    };

    const result = build({
      data: validObj,
      options: {
        loader: mockParser,
        platforms: [mockPlatform],
      },
    });

    expect(result).toEqual([
      {
        filePath: "test.json",
        content: "formatted",
      },
    ]);
  });

  it("should apply transforms when provided", () => {
    const validObj = {
      $type: "color",
      tokens: {},
    };

    const transformFormat: Platform = {
      ...mockPlatform,
      transforms: [
        {
          type: "name",
          name: "test",
          transitive: true,
          transformer: (name: string) => name.toUpperCase(),
        },
      ],
    };

    const result = build({
      data: validObj,
      options: {
        loader: mockParser,
        platforms: [transformFormat],
      },
    });

    expect(result).toEqual([
      {
        filePath: "test.json",
        content: "formatted",
      },
    ]);
  });

  it("should apply file filters when provided", () => {
    const validObj = {
      $type: "color",
      tokens: {},
    };

    const filterFormat: Platform = {
      ...mockPlatform,
      outputs: [
        {
          name: "test.json",
          filter: () => true,
        },
      ],
    };

    const result = build({
      data: validObj,
      options: {
        loader: mockParser,
        platforms: [filterFormat],
      },
    });

    expect(result).toEqual([
      {
        filePath: "test.json",
        content: "formatted",
      },
    ]);
  });
});
