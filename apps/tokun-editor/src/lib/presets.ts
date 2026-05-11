import advancedBase from "../../../../examples/templates/advanced/tokens/base.tokens.json";
import advancedColor from "../../../../examples/templates/advanced/tokens/theme/color.tokens.json";
import advancedCustom from "../../../../examples/templates/advanced/tokens/theme/custom.tokens.json";
import advancedMore from "../../../../examples/templates/advanced/tokens/theme/more.tokens.json";
import advancedTypography from "../../../../examples/templates/advanced/tokens/theme/typography.tokens.json";
import simpleTokens from "../../../../examples/templates/simple/simple.tokens.json";
import {
  createId,
  type TokenDocument,
  type TokenFile,
} from "./token-documents";

export type EditorPreset = {
  id: string;
  label: string;
  description: string;
  files: Omit<TokenFile, "id">[];
};

export const editorPresets: EditorPreset[] = [
  {
    id: "simple",
    label: "Simple",
    description: "A compact starter file for trying the structured editor.",
    files: [
      {
        path: "simple.tokens.json",
        document: simpleTokens as TokenDocument,
      },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    description:
      "Multiple token files with aliases, groups, and composite values.",
    files: [
      {
        path: "tokens/base.tokens.json",
        document: advancedBase as TokenDocument,
      },
      {
        path: "tokens/theme/color.tokens.json",
        document: advancedColor as TokenDocument,
      },
      {
        path: "tokens/theme/custom.tokens.json",
        document: advancedCustom as TokenDocument,
      },
      {
        path: "tokens/theme/more.tokens.json",
        document: advancedMore as TokenDocument,
      },
      {
        path: "tokens/theme/typography.tokens.json",
        document: advancedTypography as TokenDocument,
      },
    ],
  },
];

export function createPresetFiles(presetId = "simple"): TokenFile[] {
  const preset =
    editorPresets.find((candidate) => candidate.id === presetId) ??
    editorPresets[0];

  return (preset?.files ?? []).map((file) => ({
    id: createId("file"),
    path: file.path,
    document: structuredClone(file.document),
  }));
}
