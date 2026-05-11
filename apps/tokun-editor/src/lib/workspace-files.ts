import {
  createId,
  isRecord,
  type CustomTokenType,
  type TokenDocument,
  type TokenFile,
} from "./token-documents";

export function createBlankWorkspaceFiles(): TokenFile[] {
  return [
    {
      id: createId("file"),
      path: "tokens.tokens.json",
      document: {},
    },
  ];
}

export type ImportedWorkspace = {
  files: TokenFile[];
  customTypes: CustomTokenType[];
};

export function exportWorkspace(
  files: TokenFile[],
  customTypes: CustomTokenType[] = [],
) {
  const payload = JSON.stringify(
    {
      files: files.map(({ path, document }) => ({ path, document })),
      customTypes,
    },
    null,
    2,
  );
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tokun-editor-workspace.json";
  link.click();
  URL.revokeObjectURL(url);
}

export async function readWorkspaceFile(
  file: File,
): Promise<ImportedWorkspace> {
  const text = await file.text();
  const parsed = JSON.parse(text) as unknown;
  return parseImportedFiles(parsed, file.name);
}

function parseImportedFiles(
  value: unknown,
  fallbackPath: string,
): ImportedWorkspace {
  if (isRecord(value) && Array.isArray(value.files)) {
    return {
      files: value.files.flatMap((entry, index): TokenFile[] => {
        if (!isRecord(entry) || !isRecord(entry.document)) {
          return [];
        }

        return [
          {
            id: createId("file"),
            path:
              typeof entry.path === "string"
                ? entry.path
                : `tokens-${index + 1}.json`,
            document: entry.document as TokenDocument,
          },
        ];
      }),
      customTypes: parseCustomTypes(value.customTypes),
    };
  }

  if (isRecord(value)) {
    return {
      files: [
        {
          id: createId("file"),
          path: fallbackPath,
          document: value,
        },
      ],
      customTypes: [],
    };
  }

  throw new Error(
    "Imported JSON must be a token object or exported workspace.",
  );
}

function parseCustomTypes(value: unknown): CustomTokenType[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry): CustomTokenType[] => {
    if (!isRecord(entry) || typeof entry.name !== "string") {
      return [];
    }

    return [
      {
        name: entry.name,
        defaultValue: structuredClone(entry.defaultValue),
      },
    ];
  });
}
