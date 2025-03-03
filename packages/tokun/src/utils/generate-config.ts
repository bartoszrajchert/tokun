import { Format, Loader, Transform, TransformGroup } from "utils/types.js";
import { cssFormat } from "../builder/formats/css-format.js";
import { detailedJsonFormat } from "../builder/formats/detailed-json-format.js";
import { flattenJsonFormat } from "../builder/formats/flatten-json-format.js";
import { dtcgJsonLoader } from "../builder/loaders/dtcg-json-loader.js";
import { camelCaseTransform } from "../builder/transforms/camel-case-transform.js";
import { cssTransforms } from "../builder/transforms/css/css-transforms.js";
import { kebabCaseTransform } from "../builder/transforms/kebab-case-transform.js";
import { ConfigOptions } from "../types/define-config.js";
import { FormatName, LoaderName } from "./registry.js";

type ConfigParse = {
  loaders: Loader[];
  formatsWithTransform: {
    format: Format;
    transforms?: (Transform | TransformGroup)[];
  }[];
};

const poweredParse: ConfigParse = {
  loaders: [dtcgJsonLoader],
  formatsWithTransform: [
    {
      format: cssFormat,
      transforms: [kebabCaseTransform, cssTransforms],
    },
    {
      format: flattenJsonFormat,
      transforms: [camelCaseTransform],
    },
    {
      format: detailedJsonFormat,
    },
  ],
};

export function generateConfig({
  loader,
  format,
  name = "",
}: {
  loader: LoaderName;
  format: FormatName;
  name?: string;
}): ConfigOptions {
  const selectedLoader = poweredParse.loaders.find((l) => l.name === loader);
  const selectedFormatWithTransform = poweredParse.formatsWithTransform.find(
    (f) => f.format.name === format,
  );

  if (!selectedLoader) {
    throw new Error(`Loader with name ${loader} not found`);
  }

  if (!selectedFormatWithTransform) {
    throw new Error(`Format with name ${format} not found`);
  }

  return {
    loader: selectedLoader,
    platforms: [
      {
        name: "platform",
        format: selectedFormatWithTransform.format,
        transforms: selectedFormatWithTransform.transforms,
        outputs: [
          {
            name,
          },
        ],
      },
    ],
  };
}
