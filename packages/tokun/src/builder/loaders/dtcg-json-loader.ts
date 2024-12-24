import { yellow } from "kleur/colors";
import { GradientToken } from "types/definitions.js";
import { isReference } from "utils/helpers.js";
import { FlattenTokens, resolveTokens, toFlat } from "utils/to-flat.js";

import { Loader } from "utils/types.js";

export const dtcgJsonLoader: Loader = {
  name: "dtcg-json",
  pattern: /(?:\.tokens)?(?:\.json)?$/,
  loadFn: ({ content }) => {
    const { flatten } = toFlat(content);
    const resolvedFlatten = resolveTokens(flatten);

    fixGradientPosition(resolvedFlatten);
    // TODO: Dash array fix -> https://tr.designtokens.org/format/#object-value
    // TODO: Fallbacks https://tr.designtokens.org/format/#fallbacks

    return resolvedFlatten;
  },
};

/**
 * Gradient fix according to the design-tokens spec
 *
 * @link https://tr.designtokens.org/format/#gradient
 */
const fixGradientPosition = (flatten: FlattenTokens) => {
  flatten.forEach((anyToken, name) => {
    if (anyToken.$type === "gradient") {
      const token = anyToken as GradientToken;

      if (isReference(token.$value)) {
        return;
      }

      token.$value = token.$value.map((gradient, i) => {
        if (isReference(gradient)) {
          return gradient;
        }

        if (isReference(gradient.position)) {
          return gradient;
        }

        if (gradient.position > 1) {
          console.warn(
            yellow(
              `⚠ The position of the gradient in "${name}" for "${gradient.color}" is set to ${gradient.position}. It should not be more then 1. Setting it to 1.`,
            ),
          );
          gradient.position = 1;

          // if (
          //   token.resolvedValue &&
          //   token.resolvedValue[i] &&
          //   !isReference(token.resolvedValue[i]) &&
          //   !isReference(token.resolvedValue[i].position)
          // ) {
          //   token.resolvedValue[i].position = 1;
          // }
        } else if (gradient.position < 0) {
          console.warn(
            yellow(
              `⚠ The position of the gradient in "${name}" for "${gradient.color}" is set to ${gradient.position}. It should not be less then 0. Setting it to 0.`,
            ),
          );
          gradient.position = 0;
          // if (
          //   token.resolvedValue &&
          //   token.resolvedValue[i] &&
          //   !isReference(token.resolvedValue[i]) &&
          //   !isReference(token.resolvedValue[i].position)
          // ) {
          //   token.resolvedValue[i]!.position = 0;
          // }
        }

        return gradient;
      });

      // if (!token.resolvedValue) {
      //   return;
      // }
    }
  });
};
