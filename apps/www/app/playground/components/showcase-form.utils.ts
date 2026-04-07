import type {
  InputFile,
  InputParseError,
  PresetFile,
  TreeDirectoryNode,
} from "./showcase-form.types";

type ParseFilesResult = {
  parsed: Record<string, unknown>[] | null;
  error: InputParseError | null;
};

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}

export function normalizeFilePath(value: string): string {
  return value
    .replaceAll("\\", "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .trim();
}

export function splitFilePath(value: string): string[] {
  const normalized = normalizeFilePath(value);
  return normalized.length > 0 ? normalized.split("/") : [];
}

export function createFileId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `file-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function toInputFiles(files: PresetFile[]): InputFile[] {
  if (files.length === 0) {
    return [{ id: createFileId(), name: "tokens.json", content: "{}" }];
  }

  return files.map((file) => ({
    id: createFileId(),
    name: normalizeFilePath(file.name) || "tokens.json",
    content: file.content,
  }));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = { ...target };

  Object.entries(source).forEach(([key, value]) => {
    const currentValue = output[key];

    if (isRecord(currentValue) && isRecord(value)) {
      output[key] = deepMerge(currentValue, value);
      return;
    }

    output[key] = value;
  });

  return output;
}

export function mergeParsedFiles(
  parsedFiles: Record<string, unknown>[],
): Record<string, unknown> {
  return parsedFiles.reduce(
    (acc, fileContent) => deepMerge(acc, fileContent),
    {},
  );
}

function createDirectoryNode(name: string, path: string): TreeDirectoryNode {
  return {
    type: "directory",
    name,
    path,
    children: [],
  };
}

function sortTree(node: TreeDirectoryNode): void {
  node.children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });

  node.children.forEach((child) => {
    if (child.type === "directory") {
      sortTree(child);
    }
  });
}

export function buildFileTree(files: InputFile[]): TreeDirectoryNode {
  const root = createDirectoryNode("root", "");

  files.forEach((file, index) => {
    const segments = splitFilePath(file.name);
    const pathSegments =
      segments.length > 0 ? segments : [`unnamed-${index + 1}.json`];

    let currentNode = root;

    pathSegments.forEach((segment, segmentIndex) => {
      const isLeaf = segmentIndex === pathSegments.length - 1;
      const segmentPath = pathSegments.slice(0, segmentIndex + 1).join("/");

      if (isLeaf) {
        currentNode.children.push({
          type: "file",
          name: segment,
          path: segmentPath,
          fileId: file.id,
        });
        return;
      }

      const existingDirectory = currentNode.children.find(
        (child): child is TreeDirectoryNode =>
          child.type === "directory" && child.name === segment,
      );

      if (existingDirectory) {
        currentNode = existingDirectory;
        return;
      }

      const newDirectory = createDirectoryNode(segment, segmentPath);
      currentNode.children.push(newDirectory);
      currentNode = newDirectory;
    });
  });

  sortTree(root);

  return root;
}

export function collectDirectoryPaths(files: InputFile[]): string[] {
  const paths = new Set<string>();

  files.forEach((file) => {
    const segments = splitFilePath(file.name);
    for (let i = 0; i < segments.length - 1; i += 1) {
      paths.add(segments.slice(0, i + 1).join("/"));
    }
  });

  return [...paths];
}

export function parseInputFiles(files: InputFile[]): ParseFilesResult {
  const parsedFiles: Record<string, unknown>[] = [];
  const knownPaths = new Map<string, string>();

  for (const file of files) {
    const normalizedName = normalizeFilePath(file.name);

    if (normalizedName.length === 0) {
      return {
        parsed: null,
        error: {
          fileId: file.id,
          fileName: file.name || "Unnamed file",
          message: "File path cannot be empty.",
        },
      };
    }

    if (knownPaths.has(normalizedName)) {
      return {
        parsed: null,
        error: {
          fileId: file.id,
          fileName: normalizedName,
          message:
            "Another file already uses this path. Use unique file paths.",
        },
      };
    }

    knownPaths.set(normalizedName, file.id);

    if (file.content.trim() === "") {
      return {
        parsed: null,
        error: {
          fileId: file.id,
          fileName: normalizedName,
          message: "File is empty. Add a JSON object before running.",
        },
      };
    }

    try {
      const parsed = JSON.parse(file.content) as unknown;

      if (!isRecord(parsed)) {
        return {
          parsed: null,
          error: {
            fileId: file.id,
            fileName: normalizedName,
            message:
              'File root must be a JSON object (for example: { "tokens": {} }).',
          },
        };
      }

      parsedFiles.push(parsed);
    } catch (error) {
      return {
        parsed: null,
        error: {
          fileId: file.id,
          fileName: normalizedName,
          message: getErrorMessage(error, "Invalid JSON."),
        },
      };
    }
  }

  return {
    parsed: parsedFiles,
    error: null,
  };
}

export function createNextFileName(
  files: InputFile[],
  activeDirectory: string,
): string {
  const knownPaths = new Set(files.map((file) => normalizeFilePath(file.name)));
  let index = 1;
  let fileName = activeDirectory
    ? `${activeDirectory}/tokens-${index}.json`
    : `tokens-${index}.json`;

  while (knownPaths.has(normalizeFilePath(fileName))) {
    index += 1;
    fileName = activeDirectory
      ? `${activeDirectory}/tokens-${index}.json`
      : `tokens-${index}.json`;
  }

  return fileName;
}
