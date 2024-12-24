import { build, buildObject } from "builder/tokun.js";
import { Loader, UseFormat } from "utils/types.js";
import { describe, expect, it, vi } from "vitest";

describe("parseDesignTokens", () => {
  const mockParser: Loader = {
    name: "test",
    loadFn: vi.fn().mockReturnValue(new Map()),
    pattern: /\.json$/,
  };

  const mockFormat = {
    format: {
      name: "test",
      formatter: vi.fn().mockReturnValue("formatted"),
    },
    files: [{ output: "test.json" }],
  };

  it("should validate tokens and throw error for invalid content", () => {
    const invalidObj = { invalid: "content" };

    expect(() =>
      buildObject({
        obj: invalidObj,
        loader: mockParser,
        formats: [mockFormat],
      }),
    ).toThrowError();
  });

  it("should parse and format valid tokens", () => {
    const validObj = {
      $type: "color",
      tokens: {},
    };

    const result = buildObject({
      obj: validObj,
      loader: mockParser,
      formats: [mockFormat],
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

    const transformFormat: UseFormat = {
      ...mockFormat,
      transforms: [
        {
          type: "name",
          name: "test",
          transitive: true,
          transformer: (name: string) => name.toUpperCase(),
        },
      ],
    };

    const result = buildObject({
      obj: validObj,
      loader: mockParser,
      formats: [transformFormat],
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

    const filterFormat = {
      ...mockFormat,
      files: [
        {
          output: "test.json",
          filter: () => true,
        },
      ],
    };

    const result = buildObject({
      obj: validObj,
      loader: mockParser,
      formats: [filterFormat],
    });

    expect(result).toEqual([
      {
        filePath: "test.json",
        content: "formatted",
      },
    ]);
  });
});
