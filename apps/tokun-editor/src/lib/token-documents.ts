export const TOKEN_TYPES = [
  "color",
  "dimension",
  "fontFamily",
  "fontWeight",
  "duration",
  "cubicBezier",
  "number",
  "strokeStyle",
  "border",
  "transition",
  "shadow",
  "gradient",
  "typography",
] as const;

export type TokenType = (typeof TOKEN_TYPES)[number];

export type CustomTokenType = {
  name: string;
  defaultValue: unknown;
};

export type TokenDocument = Record<string, unknown>;

export type TokenObject = Record<string, unknown> & {
  $value: unknown;
  $type?: string;
  $description?: string;
  $deprecated?: boolean | string;
  $extensions?: Record<string, unknown>;
};

export type StructuredColorValue = {
  colorSpace: "srgb";
  components: number[];
  alpha: number;
  hex: string;
};

export type TokenFile = {
  id: string;
  path: string;
  document: TokenDocument;
};

export type Selection =
  | { kind: "file"; fileId: string; path: [] }
  | { kind: "group"; fileId: string; path: string[] }
  | { kind: "token"; fileId: string; path: string[] };

export type DirectoryTreeNode = {
  kind: "directory";
  id: string;
  name: string;
  path: string;
  children: SidebarTreeNode[];
};

export type FileTreeNode = {
  kind: "file";
  id: string;
  name: string;
  fileId: string;
  path: string;
  children: SidebarTreeNode[];
};

export type GroupTreeNode = {
  kind: "group";
  id: string;
  name: string;
  fileId: string;
  path: string[];
  children: SidebarTreeNode[];
};

export type TokenTreeNode = {
  kind: "token";
  id: string;
  name: string;
  fileId: string;
  path: string[];
  tokenType?: string;
};

export type SidebarTreeNode =
  | DirectoryTreeNode
  | FileTreeNode
  | GroupTreeNode
  | TokenTreeNode;

export type GroupOnlyTreeNode = {
  id: string;
  name: string;
  fileId: string;
  path: string[];
  children: GroupOnlyTreeNode[];
  hasAttributes: boolean;
};

export type ListedToken = {
  fileId: string;
  filePath: string;
  groupPath: string[];
  path: string[];
  name: string;
  token: TokenObject;
};

export type ReferenceHit = {
  fileId: string;
  filePath: string;
  ownerPath: string;
  reference: string;
};

export type TokenReferenceOption = {
  fileId: string;
  filePath: string;
  name: string;
  path: string[];
  reference: `{${string}}`;
  type?: string;
};

type PathMapping = {
  from: string;
  to: string;
  mode: "exact" | "prefix";
  preserveRootSyntax?: boolean;
  toUsesRootToken?: boolean;
};

const RESERVED_GROUP_KEYS = new Set([
  "$schema",
  "$type",
  "$description",
  "$extensions",
  "$deprecated",
  "$extends",
]);

const CURLY_REFERENCE_RE = /^\{(.+)\}$/;

export function isBuiltInTokenType(
  value: string | undefined,
): value is TokenType {
  return TOKEN_TYPES.includes(value as TokenType);
}

export function getAvailableTokenTypes(
  customTypes: CustomTokenType[],
): string[] {
  return [...TOKEN_TYPES, ...customTypes.map((type) => type.name)];
}

export function validateCustomTokenTypeName(
  name: string,
  customTypes: CustomTokenType[],
  currentName?: string,
): string | null {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return "Type name cannot be empty.";
  }

  if (/\s/.test(trimmed)) {
    return "Type name cannot contain whitespace.";
  }

  if (/[{}.$]/.test(trimmed)) {
    return "Type name cannot contain {, }, ., or $ characters.";
  }

  if (isBuiltInTokenType(trimmed)) {
    return `"${trimmed}" is a built-in token type.`;
  }

  if (
    customTypes.some(
      (type) => type.name === trimmed && type.name !== currentName,
    )
  ) {
    return `A custom type named "${trimmed}" already exists.`;
  }

  return null;
}

export function createId(prefix = "id"): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function cloneTokenFiles(files: TokenFile[]): TokenFile[] {
  return structuredClone(files);
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isTokenObject(value: unknown): value is TokenObject {
  return isRecord(value) && Object.hasOwn(value, "$value");
}

export function pathToLabel(path: string[]): string {
  return path.length === 0 ? "root" : path.join(".");
}

export function tokenPathToReferencePath(path: string[]): string {
  const rawPath = path.join(".");
  return normalizeRootTokenPath(rawPath);
}

export function normalizeRootTokenPath(path: string): string {
  if (path === "$root") {
    return "";
  }

  if (path.endsWith(".$root")) {
    return path.slice(0, -".$root".length);
  }

  return path;
}

export function validateNodeName(
  name: string,
  options: { allowRootToken?: boolean } = {},
): string | null {
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return "Name cannot be empty.";
  }

  if (options.allowRootToken && trimmed === "$root") {
    return null;
  }

  if (trimmed.startsWith("$")) {
    return 'Only the special "$root" token may start with $.';
  }

  if (/[{}.]/.test(trimmed)) {
    return "Names cannot contain {, }, or . characters.";
  }

  return null;
}

export function createStructuredColor(hex: string): StructuredColorValue {
  const normalizedHex = normalizeHexColor(hex);
  const bigint = Number.parseInt(normalizedHex.slice(1), 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;

  return {
    colorSpace: "srgb",
    components: [red / 255, green / 255, blue / 255],
    alpha: 1,
    hex: normalizedHex,
  };
}

export function normalizeHexColor(value: string): string {
  const trimmed = value.trim();

  if (/^#[\da-f]{6}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  if (/^[\da-f]{6}$/i.test(trimmed)) {
    return `#${trimmed.toLowerCase()}`;
  }

  return "#000000";
}

export function defaultTokenValue(
  type: string,
  customTypes: CustomTokenType[] = [],
): unknown {
  const customType = customTypes.find((candidate) => candidate.name === type);

  if (customType) {
    return structuredClone(customType.defaultValue);
  }

  switch (type) {
    case "color":
      return createStructuredColor("#6d5dfc");
    case "dimension":
      return { value: 16, unit: "px" };
    case "fontFamily":
      return "Inter";
    case "fontWeight":
      return 400;
    case "duration":
      return { value: 150, unit: "ms" };
    case "cubicBezier":
      return [0.2, 0, 0, 1];
    case "number":
      return 1;
    case "strokeStyle":
      return "solid";
    case "border":
      return {
        width: { value: 1, unit: "px" },
        style: "solid",
        color: createStructuredColor("#111111"),
      };
    case "transition":
      return {
        duration: { value: 150, unit: "ms" },
        delay: { value: 0, unit: "ms" },
        timingFunction: [0.2, 0, 0, 1],
      };
    case "shadow":
      return {
        color: createStructuredColor("#000000"),
        offsetX: { value: 0, unit: "px" },
        offsetY: { value: 8, unit: "px" },
        blur: { value: 24, unit: "px" },
        spread: { value: 0, unit: "px" },
      };
    case "gradient":
      return [
        { color: createStructuredColor("#6d5dfc"), position: 0 },
        { color: createStructuredColor("#34d399"), position: 1 },
      ];
    case "typography":
      return {
        fontFamily: "Inter",
        fontSize: { value: 16, unit: "px" },
        fontWeight: 400,
        letterSpacing: { value: 0, unit: "px" },
        lineHeight: 1.5,
      };
    default:
      return "";
  }
}

export function createDefaultToken(
  type = "color",
  customTypes: CustomTokenType[] = [],
): TokenObject {
  return {
    $type: type,
    $value: defaultTokenValue(type, customTypes),
  };
}

export function collectTokenReferenceOptions(
  files: TokenFile[],
): TokenReferenceOption[] {
  return files.flatMap((file) =>
    collectTokenReferenceOptionsFromGroup({
      file,
      group: file.document,
      path: [],
      inheritedType:
        typeof file.document.$type === "string"
          ? file.document.$type
          : undefined,
    }),
  );
}

function collectTokenReferenceOptionsFromGroup(args: {
  file: TokenFile;
  group: Record<string, unknown>;
  path: string[];
  inheritedType?: string;
}): TokenReferenceOption[] {
  const { file, group, path, inheritedType } = args;
  const nextInheritedType =
    typeof group.$type === "string" ? group.$type : inheritedType;
  const options: TokenReferenceOption[] = [];

  for (const [key, value] of Object.entries(group)) {
    if (RESERVED_GROUP_KEYS.has(key) || !isRecord(value)) {
      continue;
    }

    const childPath = [...path, key];

    if (isTokenObject(value)) {
      const tokenType =
        typeof value.$type === "string" ? value.$type : nextInheritedType;
      options.push({
        fileId: file.id,
        filePath: file.path,
        name: key,
        path: childPath,
        reference: `{${childPath.join(".")}}`,
        type: tokenType,
      });
      continue;
    }

    options.push(
      ...collectTokenReferenceOptionsFromGroup({
        file,
        group: value,
        path: childPath,
        inheritedType: nextInheritedType,
      }),
    );
  }

  return options.sort((a, b) => a.reference.localeCompare(b.reference));
}

export function getFile(files: TokenFile[], fileId: string): TokenFile | null {
  return files.find((file) => file.id === fileId) ?? null;
}

export function getGroupAtPath(
  document: TokenDocument,
  path: string[],
): Record<string, unknown> | null {
  let current: unknown = document;

  for (const segment of path) {
    if (!isRecord(current) || isTokenObject(current)) {
      return null;
    }

    current = current[segment];
  }

  if (!isRecord(current) || isTokenObject(current)) {
    return null;
  }

  return current;
}

export function getTokenAtPath(
  document: TokenDocument,
  path: string[],
): TokenObject | null {
  let current: unknown = document;

  for (const segment of path) {
    if (!isRecord(current)) {
      return null;
    }

    current = current[segment];
  }

  return isTokenObject(current) ? current : null;
}

export function getParentGroup(
  document: TokenDocument,
  path: string[],
): Record<string, unknown> | null {
  if (path.length === 0) {
    return null;
  }

  return getGroupAtPath(document, path.slice(0, -1));
}

export function createUniqueName(
  group: Record<string, unknown>,
  baseName: string,
): string {
  if (!Object.hasOwn(group, baseName)) {
    return baseName;
  }

  let index = 2;
  let candidate = `${baseName}-${index}`;

  while (Object.hasOwn(group, candidate)) {
    index += 1;
    candidate = `${baseName}-${index}`;
  }

  return candidate;
}

export function splitFilePath(filePath: string): string[] {
  return filePath
    .replaceAll("\\", "/")
    .replace(/\/+/g, "/")
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean);
}

export function buildSidebarTree(files: TokenFile[]): SidebarTreeNode[] {
  const root: DirectoryTreeNode = {
    kind: "directory",
    id: "root",
    name: "root",
    path: "",
    children: [],
  };

  for (const file of files) {
    const parts = splitFilePath(file.path);
    const fileName = parts.at(-1) ?? file.path;
    const directoryParts = parts.slice(0, -1);
    let currentDirectory = root;

    for (const directoryName of directoryParts) {
      const directoryPath = currentDirectory.path
        ? `${currentDirectory.path}/${directoryName}`
        : directoryName;
      const existingDirectory = currentDirectory.children.find(
        (child): child is DirectoryTreeNode =>
          child.kind === "directory" && child.name === directoryName,
      );

      if (existingDirectory) {
        currentDirectory = existingDirectory;
        continue;
      }

      const nextDirectory: DirectoryTreeNode = {
        kind: "directory",
        id: `directory:${directoryPath}`,
        name: directoryName,
        path: directoryPath,
        children: [],
      };
      currentDirectory.children.push(nextDirectory);
      currentDirectory = nextDirectory;
    }

    currentDirectory.children.push({
      kind: "file",
      id: `file:${file.id}`,
      name: fileName,
      fileId: file.id,
      path: file.path,
      children: buildGroupTree(file.id, file.document, []),
    });
  }

  sortSidebarNodes(root.children);
  return root.children;
}

export function buildGroupOnlyTree(file: TokenFile): GroupOnlyTreeNode {
  return {
    id: `group:${file.id}:root`,
    name: "Root",
    fileId: file.id,
    path: [],
    hasAttributes: hasGroupAttributes(file.document),
    children: buildGroupOnlyChildren(file.id, file.document, []),
  };
}

function buildGroupOnlyChildren(
  fileId: string,
  group: Record<string, unknown>,
  path: string[],
): GroupOnlyTreeNode[] {
  const children: GroupOnlyTreeNode[] = [];

  for (const [key, value] of Object.entries(group)) {
    if (
      RESERVED_GROUP_KEYS.has(key) ||
      !isRecord(value) ||
      isTokenObject(value)
    ) {
      continue;
    }

    const childPath = [...path, key];
    children.push({
      id: `group:${fileId}:${childPath.join(".")}`,
      name: key,
      fileId,
      path: childPath,
      hasAttributes: hasGroupAttributes(value),
      children: buildGroupOnlyChildren(fileId, value, childPath),
    });
  }

  children.sort((a, b) => a.name.localeCompare(b.name));
  return children;
}

export function hasGroupAttributes(group: Record<string, unknown>): boolean {
  return [
    "$schema",
    "$type",
    "$description",
    "$extensions",
    "$deprecated",
    "$extends",
  ].some((key) => group[key] !== undefined && group[key] !== "");
}

export function collectTokensForGroup(
  file: TokenFile,
  groupPath: string[],
): ListedToken[] {
  const group = getGroupAtPath(file.document, groupPath);

  if (!group) {
    return [];
  }

  return collectTokensFromGroup(file, group, groupPath);
}

function collectTokensFromGroup(
  file: TokenFile,
  group: Record<string, unknown>,
  groupPath: string[],
): ListedToken[] {
  const tokens: ListedToken[] = [];

  for (const [key, value] of Object.entries(group)) {
    if (RESERVED_GROUP_KEYS.has(key) || !isRecord(value)) {
      continue;
    }

    const childPath = [...groupPath, key];

    if (isTokenObject(value)) {
      tokens.push({
        fileId: file.id,
        filePath: file.path,
        groupPath,
        path: childPath,
        name: key,
        token: value,
      });
      continue;
    }

    tokens.push(...collectTokensFromGroup(file, value, childPath));
  }

  return tokens.sort((a, b) =>
    a.path.join(".").localeCompare(b.path.join(".")),
  );
}

function buildGroupTree(
  fileId: string,
  group: Record<string, unknown>,
  path: string[],
): SidebarTreeNode[] {
  const children: SidebarTreeNode[] = [];

  for (const [key, value] of Object.entries(group)) {
    if (RESERVED_GROUP_KEYS.has(key)) {
      continue;
    }

    if (!isRecord(value)) {
      continue;
    }

    const childPath = [...path, key];

    if (isTokenObject(value)) {
      children.push({
        kind: "token",
        id: `token:${fileId}:${childPath.join(".")}`,
        name: key,
        fileId,
        path: childPath,
        tokenType: typeof value.$type === "string" ? value.$type : undefined,
      });
      continue;
    }

    children.push({
      kind: "group",
      id: `group:${fileId}:${childPath.join(".")}`,
      name: key,
      fileId,
      path: childPath,
      children: buildGroupTree(fileId, value, childPath),
    });
  }

  sortSidebarNodes(children);
  return children;
}

function sortSidebarNodes(nodes: SidebarTreeNode[]): void {
  nodes.sort((a, b) => {
    const weight = (node: SidebarTreeNode) => {
      switch (node.kind) {
        case "directory":
          return 0;
        case "file":
          return 1;
        case "group":
          return 2;
        case "token":
          return 3;
      }
    };

    const weightDiff = weight(a) - weight(b);
    return weightDiff === 0 ? a.name.localeCompare(b.name) : weightDiff;
  });

  for (const node of nodes) {
    if ("children" in node) {
      sortSidebarNodes(node.children);
    }
  }
}

export function mergeDocuments(files: TokenFile[]): TokenDocument {
  return files.reduce<TokenDocument>(
    (acc, file) => deepMerge(acc, file.document),
    {},
  );
}

function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const output: Record<string, unknown> = { ...target };

  for (const [key, value] of Object.entries(source)) {
    const currentValue = output[key];

    if (
      isRecord(currentValue) &&
      !isTokenObject(currentValue) &&
      isRecord(value) &&
      !isTokenObject(value)
    ) {
      output[key] = deepMerge(currentValue, value);
      continue;
    }

    output[key] = structuredClone(value);
  }

  return output;
}

export function renameGroupInFiles(args: {
  files: TokenFile[];
  fileId: string;
  path: string[];
  nextName: string;
}): TokenFile[] {
  const { files, fileId, path, nextName } = args;
  const nextFiles = cloneTokenFiles(files);
  const file = getFile(nextFiles, fileId);

  if (!file) {
    throw new Error("Selected file was not found.");
  }

  const oldName = path.at(-1);
  const parentGroup = getParentGroup(file.document, path);

  if (!oldName || !parentGroup) {
    throw new Error("Selected group was not found.");
  }

  const nameError = validateNodeName(nextName);
  if (nameError) {
    throw new Error(nameError);
  }

  if (oldName === nextName) {
    return nextFiles;
  }

  if (Object.hasOwn(parentGroup, nextName)) {
    throw new Error(`A sibling named "${nextName}" already exists.`);
  }

  parentGroup[nextName] = parentGroup[oldName];
  delete parentGroup[oldName];

  const oldGroupPath = path.join(".");
  const newGroupPath = [...path.slice(0, -1), nextName].join(".");

  return rewriteReferences(nextFiles, [
    {
      from: oldGroupPath,
      to: newGroupPath,
      mode: "prefix",
      preserveRootSyntax: true,
    },
  ]);
}

export function renameTokenInFiles(args: {
  files: TokenFile[];
  fileId: string;
  path: string[];
  nextName: string;
}): TokenFile[] {
  const { files, fileId, path, nextName } = args;
  const nextFiles = cloneTokenFiles(files);
  const file = getFile(nextFiles, fileId);

  if (!file) {
    throw new Error("Selected file was not found.");
  }

  const oldName = path.at(-1);
  const parentGroup = getParentGroup(file.document, path);

  if (!oldName || !parentGroup) {
    throw new Error("Selected token was not found.");
  }

  const nameError = validateNodeName(nextName, { allowRootToken: true });
  if (nameError) {
    throw new Error(nameError);
  }

  if (oldName === nextName) {
    return nextFiles;
  }

  if (Object.hasOwn(parentGroup, nextName)) {
    throw new Error(`A sibling named "${nextName}" already exists.`);
  }

  parentGroup[nextName] = parentGroup[oldName];
  delete parentGroup[oldName];

  const oldTokenPath = tokenPathToReferencePath(path);
  const newTokenPath = tokenPathToReferencePath([
    ...path.slice(0, -1),
    nextName,
  ]);

  return rewriteReferences(nextFiles, [
    {
      from: oldTokenPath,
      to: newTokenPath,
      mode: "exact",
      toUsesRootToken: nextName === "$root",
    },
  ]);
}

export function collectIncomingReferences(
  files: TokenFile[],
  target: { path: string; mode: "exact" | "prefix" },
): ReferenceHit[] {
  const hits: ReferenceHit[] = [];

  for (const file of files) {
    collectReferencesFromValue({
      value: file.document,
      file,
      ownerPath: file.path,
      target,
      hits,
    });
  }

  return hits;
}

function collectReferencesFromValue(args: {
  value: unknown;
  file: TokenFile;
  ownerPath: string;
  target: { path: string; mode: "exact" | "prefix" };
  hits: ReferenceHit[];
}): void {
  const { value, file, ownerPath, target, hits } = args;

  if (typeof value === "string") {
    const normalized = getReferencePath(value);

    if (normalized && mappingApplies(normalized, target)) {
      hits.push({
        fileId: file.id,
        filePath: file.path,
        ownerPath,
        reference: value,
      });
    }

    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      collectReferencesFromValue({
        value: entry,
        file,
        ownerPath: `${ownerPath}[${index}]`,
        target,
        hits,
      });
    });
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    collectReferencesFromValue({
      value: nestedValue,
      file,
      ownerPath: ownerPath ? `${ownerPath}.${key}` : key,
      target,
      hits,
    });
  }
}

function getReferencePath(value: string): string | null {
  const curlyMatch = value.match(CURLY_REFERENCE_RE);
  if (curlyMatch?.[1]) {
    return normalizeRootTokenPath(curlyMatch[1]);
  }

  if (value.startsWith("#/")) {
    return normalizeRootTokenPath(decodeJsonPointer(value).join("."));
  }

  return null;
}

function mappingApplies(
  normalizedPath: string,
  mapping: { path: string; mode: "exact" | "prefix" },
): boolean {
  if (mapping.mode === "exact") {
    return normalizedPath === mapping.path;
  }

  return (
    normalizedPath === mapping.path ||
    normalizedPath.startsWith(`${mapping.path}.`)
  );
}

export function rewriteReferences(
  files: TokenFile[],
  mappings: PathMapping[],
): TokenFile[] {
  return files.map((file) => ({
    ...file,
    document: rewriteReferenceValue(file.document, mappings) as TokenDocument,
  }));
}

function rewriteReferenceValue(
  value: unknown,
  mappings: PathMapping[],
): unknown {
  if (typeof value === "string") {
    return rewriteReferenceString(value, mappings);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => rewriteReferenceValue(entry, mappings));
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      rewriteReferenceValue(nestedValue, mappings),
    ]),
  );
}

function rewriteReferenceString(
  value: string,
  mappings: PathMapping[],
): string {
  const curlyMatch = value.match(CURLY_REFERENCE_RE);

  if (curlyMatch?.[1]) {
    const rewrittenPath = rewriteReferencePath(curlyMatch[1], mappings);
    return rewrittenPath === curlyMatch[1] ? value : `{${rewrittenPath}}`;
  }

  if (value.startsWith("#/")) {
    const segments = decodeJsonPointer(value);
    const rawPath = segments.join(".");
    const rewrittenPath = rewriteReferencePath(rawPath, mappings);

    if (rewrittenPath === rawPath) {
      return value;
    }

    return encodeJsonPointer(rewrittenPath.split(".").filter(Boolean));
  }

  return value;
}

function rewriteReferencePath(
  rawPath: string,
  mappings: PathMapping[],
): string {
  const normalizedPath = normalizeRootTokenPath(rawPath);
  const usesRootToken = rawPath === "$root" || rawPath.endsWith(".$root");

  for (const mapping of mappings) {
    if (mapping.mode === "exact" && normalizedPath === mapping.from) {
      return restoreMappedPath(mapping.to, mapping, usesRootToken);
    }

    if (
      mapping.mode === "prefix" &&
      (normalizedPath === mapping.from ||
        normalizedPath.startsWith(`${mapping.from}.`))
    ) {
      const suffix = normalizedPath.slice(mapping.from.length);
      return restoreMappedPath(
        `${mapping.to}${suffix}`,
        mapping,
        usesRootToken,
      );
    }
  }

  return rawPath;
}

function restoreMappedPath(
  path: string,
  mapping: PathMapping,
  sourceUsesRootToken: boolean,
): string {
  if (mapping.toUsesRootToken) {
    return restoreRootPath(path, true);
  }

  if (mapping.preserveRootSyntax && sourceUsesRootToken) {
    return restoreRootPath(path, true);
  }

  return path;
}

function restoreRootPath(path: string, usesRootToken: boolean): string {
  if (!usesRootToken) {
    return path;
  }

  return path ? `${path}.$root` : "$root";
}

function decodeJsonPointer(pointer: string): string[] {
  const raw = pointer.slice(2);

  if (raw.length === 0) {
    return [];
  }

  return raw
    .split("/")
    .map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
}

function encodeJsonPointer(segments: string[]): string {
  return `#/${segments
    .map((segment) => segment.replace(/~/g, "~0").replace(/\//g, "~1"))
    .join("/")}`;
}

export function updateTokenAtPath(args: {
  files: TokenFile[];
  fileId: string;
  path: string[];
  updater: (token: TokenObject) => TokenObject;
}): TokenFile[] {
  const nextFiles = cloneTokenFiles(args.files);
  const file = getFile(nextFiles, args.fileId);

  if (!file) {
    throw new Error("Selected file was not found.");
  }

  const parentGroup = getParentGroup(file.document, args.path);
  const tokenName = args.path.at(-1);

  if (!parentGroup || !tokenName || !isTokenObject(parentGroup[tokenName])) {
    throw new Error("Selected token was not found.");
  }

  parentGroup[tokenName] = args.updater(parentGroup[tokenName]);

  return nextFiles;
}

export function updateGroupAtPath(args: {
  files: TokenFile[];
  fileId: string;
  path: string[];
  updater: (group: Record<string, unknown>) => Record<string, unknown>;
}): TokenFile[] {
  const nextFiles = cloneTokenFiles(args.files);
  const file = getFile(nextFiles, args.fileId);

  if (!file) {
    throw new Error("Selected file was not found.");
  }

  const group = getGroupAtPath(file.document, args.path);

  if (!group) {
    throw new Error("Selected group was not found.");
  }

  const nextGroup = args.updater(group);

  if (args.path.length === 0) {
    file.document = nextGroup;
    return nextFiles;
  }

  const parentGroup = getParentGroup(file.document, args.path);
  const groupName = args.path.at(-1);

  if (!parentGroup || !groupName) {
    throw new Error("Selected group was not found.");
  }

  parentGroup[groupName] = nextGroup;

  return nextFiles;
}
