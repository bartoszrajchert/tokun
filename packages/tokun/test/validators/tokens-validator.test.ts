import { TokenGroup } from "types/definitions.js";
import { tokensValidator } from "validators/tokens-validator.js";
import { describe, expect, it } from "vitest";

describe("tokensValidator", () => {
  it("should return no errors for a valid token group", () => {
    const validTokenGroup: TokenGroup = {
      colors: {
        token: {
          $type: "color",
          $value: "#000000",
        },
      },
      dimensions: {
        $type: "dimension",
        token: {
          $value: {
            value: 1,
            unit: "px",
          },
        },
      },
    };

    const result = tokensValidator(validTokenGroup);
    console.log(result);

    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it("should return an error for a token group with missing type", () => {
    const invalidTokenGroup: TokenGroup = {
      colors: {
        token: {
          $type: "color",
          $value: "#000000",
        },
      },
      dimensions: {
        token: {
          $value: {
            value: 1,
            unit: "px",
          },
        },
      },
    };

    const result = tokensValidator(invalidTokenGroup);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.name).toBe("missingTokenType");
  });

  it("should return an error for a token group with invalid token type", () => {
    const invalidTokenGroup: TokenGroup = {
      colors: {
        token: {
          // @ts-expect-error
          $type: "unknown",
          $value: "#000000",
        },
      },
      dimensions: {
        $type: "dimension",
        token: {
          $value: {
            value: 1,
            unit: "px",
          },
        },
      },
    };

    const result = tokensValidator(invalidTokenGroup);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.name).toBe("invalidTokenType");
  });

  it("should return an error for a token group with invalid token value", () => {
    const invalidTokenGroup: TokenGroup = {
      colors: {
        token: {
          $type: "color",
          $value: "#000000",
        },
      },
      dimensions: {
        $type: "dimension",
        token: {
          $value: "1px",
        },
      },
    };

    const result = tokensValidator(invalidTokenGroup);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.name).toBe("invalidTokenValue");
  });

  it("should return an error for a token group with invalid group properties", () => {
    const invalidTokenGroup: TokenGroup = {
      colors: {
        $type: "color",
        $unkown: {},
        token: {
          $type: "color",
          $value: "#000000",
        },
      },
      dimensions: {
        $type: "dimension",
        token: {
          $value: {
            value: 1,
            unit: "px",
          },
        },
      },
    };

    const result = tokensValidator(invalidTokenGroup);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.name).toBe("invalidGroup");
  });

  it("should return an error for a token group with a non-existent reference", () => {
    const invalidTokenGroup: TokenGroup = {
      colors: {
        token: {
          $type: "color",
          $value: "{does.not.exist}",
        },
      },
      dimensions: {
        $type: "dimension",
        token: {
          $value: {
            value: 1,
            unit: "px",
          },
        },
      },
    };

    const result = tokensValidator(invalidTokenGroup);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.name).toBe("referenceNotFound");
  });

  it("should return an error for a token group with a reference type mismatch", () => {
    const invalidTokenGroup: TokenGroup = {
      colors: {
        token: {
          $type: "color",
          $value: "{dimensions.token}",
        },
      },
      dimensions: {
        $type: "dimension",
        token: {
          $value: {
            value: 1,
            unit: "px",
          },
        },
      },
    };

    const result = tokensValidator(invalidTokenGroup);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]!.name).toBe("referenceTypeMismatch");
  });
});
