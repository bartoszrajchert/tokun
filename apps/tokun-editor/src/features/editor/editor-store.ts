import { createPresetFiles } from "@/lib/presets";
import {
  collectIncomingReferences,
  createDefaultToken,
  createId,
  createUniqueName,
  getFile,
  getGroupAtPath,
  getParentGroup,
  getTokenAtPath,
  mergeDocuments,
  pathToLabel,
  renameGroupInFiles,
  renameTokenInFiles,
  tokenPathToReferencePath,
  updateGroupAtPath,
  updateTokenAtPath,
  validateCustomTokenTypeName,
  validateNodeName,
  type CustomTokenType,
  type Selection,
  type TokenFile,
  type TokenObject,
} from "@/lib/token-documents";
import type { ValidatorError } from "tokun/validators";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type BuildOutput = {
  name: string;
  content: string;
};

export type TransformSettings = {
  format: string;
  outputReferences: boolean;
  selector: string;
  prefix: string;
};

type EditorStore = {
  files: TokenFile[];
  customTypes: CustomTokenType[];
  selectedPresetId: string;
  selected: Selection;
  transform: TransformSettings;
  outputs: BuildOutput[];
  activeOutputName: string;
  validationErrors: ValidatorError[];
  buildError: string | null;
  editorError: string | null;
  selectFile: (fileId: string) => void;
  selectGroup: (fileId: string, path: string[]) => void;
  selectToken: (fileId: string, path: string[]) => void;
  loadPreset: (presetId: string) => void;
  replaceFiles: (
    files: TokenFile[],
    selectedPresetId?: string,
    customTypes?: CustomTokenType[],
  ) => void;
  createFile: () => void;
  renameFile: (fileId: string, nextPath: string) => void;
  deleteFile: (fileId: string) => void;
  createGroup: (fileId: string, parentPath: string[]) => void;
  renameGroup: (fileId: string, path: string[], nextName: string) => void;
  deleteGroup: (fileId: string, path: string[]) => void;
  createToken: (fileId: string, parentPath: string[]) => void;
  renameToken: (fileId: string, path: string[], nextName: string) => void;
  deleteToken: (fileId: string, path: string[]) => void;
  updateGroupProperty: (
    fileId: string,
    path: string[],
    key: string,
    value: unknown,
  ) => void;
  updateToken: (
    fileId: string,
    path: string[],
    updater: (token: TokenObject) => TokenObject,
  ) => void;
  createCustomType: (name: string, defaultValue: unknown) => void;
  updateCustomType: (
    currentName: string,
    nextName: string,
    defaultValue: unknown,
  ) => void;
  deleteCustomType: (name: string) => void;
  updateTransform: (settings: Partial<TransformSettings>) => void;
  setOutputs: (outputs: BuildOutput[]) => void;
  setValidationErrors: (errors: ValidatorError[]) => void;
  setBuildError: (message: string | null) => void;
  clearMessages: () => void;
};

const outputNameByFormat: Record<string, string> = {
  css: "tokens.css",
  scss: "tokens.scss",
  "detailed-json": "tokens.detailed.json",
  "flatten-json": "tokens.json",
};

const initialFiles = createPresetFiles("simple");
const initialFileId = initialFiles[0]?.id ?? createId("file");

const initialSelection: Selection = {
  kind: "file",
  fileId: initialFileId,
  path: [],
};

const initialTransform: TransformSettings = {
  format: "css",
  outputReferences: false,
  selector: ":root",
  prefix: "",
};

export const useEditorStore = create<EditorStore>()(
  persist(
    (set) => ({
      files: initialFiles,
      customTypes: [],
      selectedPresetId: "simple",
      selected: initialSelection,
      transform: initialTransform,
      outputs: [],
      activeOutputName: "",
      validationErrors: [],
      buildError: null,
      editorError: null,

      selectFile: (fileId) =>
        set({
          selected: { kind: "file", fileId, path: [] },
          editorError: null,
        }),

      selectGroup: (fileId, path) =>
        set({ selected: { kind: "group", fileId, path }, editorError: null }),

      selectToken: (fileId, path) =>
        set({ selected: { kind: "token", fileId, path }, editorError: null }),

      loadPreset: (presetId) => {
        const files = createPresetFiles(presetId);
        const selectedFileId = files[0]?.id ?? initialFileId;
        set({
          files,
          customTypes: [],
          selectedPresetId: presetId,
          selected: { kind: "file", fileId: selectedFileId, path: [] },
          outputs: [],
          activeOutputName: "",
          validationErrors: [],
          buildError: null,
          editorError: null,
        });
      },

      replaceFiles: (files, selectedPresetId = "custom", customTypes = []) => {
        if (files.length === 0) {
          set({ editorError: "Imported workspace does not contain files." });
          return;
        }

        set({
          files,
          customTypes,
          selectedPresetId,
          selected: {
            kind: "file",
            fileId: files[0]?.id ?? initialFileId,
            path: [],
          },
          outputs: [],
          activeOutputName: "",
          validationErrors: [],
          buildError: null,
          editorError: null,
        });
      },

      createFile: () =>
        set((state) => {
          const knownPaths = new Set(state.files.map((file) => file.path));
          let index = state.files.length + 1;
          let path = `tokens-${index}.tokens.json`;

          while (knownPaths.has(path)) {
            index += 1;
            path = `tokens-${index}.tokens.json`;
          }

          const file: TokenFile = { id: createId("file"), path, document: {} };

          return {
            files: [...state.files, file],
            selectedPresetId: "custom",
            selected: { kind: "file", fileId: file.id, path: [] },
            editorError: null,
          };
        }),

      renameFile: (fileId, nextPath) =>
        set((state) => {
          const normalizedPath = nextPath.trim().replaceAll("\\", "/");

          if (normalizedPath.length === 0) {
            return { editorError: "File path cannot be empty." };
          }

          if (
            state.files.some(
              (file) => file.id !== fileId && file.path === normalizedPath,
            )
          ) {
            return {
              editorError: `A file named "${normalizedPath}" already exists.`,
            };
          }

          return {
            files: state.files.map((file) =>
              file.id === fileId ? { ...file, path: normalizedPath } : file,
            ),
            selectedPresetId: "custom",
            editorError: null,
          };
        }),

      deleteFile: (fileId) =>
        set((state) => {
          if (state.files.length <= 1) {
            return {
              editorError: "The workspace must keep at least one file.",
            };
          }

          const files = state.files.filter((file) => file.id !== fileId);
          const selected = files[0]
            ? ({ kind: "file", fileId: files[0].id, path: [] } as Selection)
            : state.selected;

          return {
            files,
            selected,
            selectedPresetId: "custom",
            outputs: [],
            activeOutputName: "",
            editorError: null,
          };
        }),

      createGroup: (fileId, parentPath) =>
        set((state) =>
          mutateFiles(state.files, (files) => {
            const file = requireFile(files, fileId);
            const parentGroup = requireGroup(file, parentPath);
            const groupName = createUniqueName(parentGroup, "group");
            parentGroup[groupName] = {};
            return {
              files,
              selectedPresetId: "custom",
              selected: {
                kind: "group",
                fileId,
                path: [...parentPath, groupName],
              } as Selection,
              editorError: null,
            };
          }),
        ),

      renameGroup: (fileId, path, nextName) =>
        set((state) => {
          try {
            const files = renameGroupInFiles({
              files: state.files,
              fileId,
              path,
              nextName: nextName.trim(),
            });

            return {
              files,
              selectedPresetId: "custom",
              selected: {
                kind: "group",
                fileId,
                path: [...path.slice(0, -1), nextName.trim()],
              } as Selection,
              outputs: [],
              activeOutputName: "",
              editorError: null,
            };
          } catch (error) {
            return { editorError: getErrorMessage(error) };
          }
        }),

      deleteGroup: (fileId, path) =>
        set((state) => {
          const targetPath = path.join(".");
          const incoming = collectIncomingReferences(state.files, {
            path: targetPath,
            mode: "prefix",
          });

          if (incoming.length > 0) {
            return {
              editorError: `Cannot delete ${pathToLabel(path)} because ${incoming.length} reference${incoming.length === 1 ? "" : "s"} still point to it. Rename is reference-safe; deletion needs those references removed first.`,
            };
          }

          return mutateFiles(state.files, (files) => {
            const file = requireFile(files, fileId);
            const parentGroup = requireParentGroup(file, path);
            const groupName = requireLastPathSegment(path, "group");
            delete parentGroup[groupName];

            return {
              files,
              selectedPresetId: "custom",
              selected: {
                kind: "group",
                fileId,
                path: path.slice(0, -1),
              } as Selection,
              outputs: [],
              activeOutputName: "",
              editorError: null,
            };
          });
        }),

      createToken: (fileId, parentPath) =>
        set((state) =>
          mutateFiles(state.files, (files) => {
            const file = requireFile(files, fileId);
            const parentGroup = requireGroup(file, parentPath);
            const tokenName = createUniqueName(parentGroup, "token");
            parentGroup[tokenName] = createDefaultToken(
              "color",
              state.customTypes,
            );

            return {
              files,
              selectedPresetId: "custom",
              selected: {
                kind: "token",
                fileId,
                path: [...parentPath, tokenName],
              } as Selection,
              editorError: null,
            };
          }),
        ),

      renameToken: (fileId, path, nextName) =>
        set((state) => {
          try {
            const files = renameTokenInFiles({
              files: state.files,
              fileId,
              path,
              nextName: nextName.trim(),
            });

            return {
              files,
              selectedPresetId: "custom",
              selected: {
                kind: "token",
                fileId,
                path: [...path.slice(0, -1), nextName.trim()],
              } as Selection,
              outputs: [],
              activeOutputName: "",
              editorError: null,
            };
          } catch (error) {
            return { editorError: getErrorMessage(error) };
          }
        }),

      deleteToken: (fileId, path) =>
        set((state) => {
          const incoming = collectIncomingReferences(state.files, {
            path: tokenPathToReferencePath(path),
            mode: "exact",
          });

          if (incoming.length > 0) {
            return {
              editorError: `Cannot delete ${pathToLabel(path)} because ${incoming.length} reference${incoming.length === 1 ? "" : "s"} still point to it. Rename is reference-safe; deletion needs those references removed first.`,
            };
          }

          return mutateFiles(state.files, (files) => {
            const file = requireFile(files, fileId);
            const parentGroup = requireParentGroup(file, path);
            const tokenName = requireLastPathSegment(path, "token");
            delete parentGroup[tokenName];

            return {
              files,
              selectedPresetId: "custom",
              selected: {
                kind: "group",
                fileId,
                path: path.slice(0, -1),
              } as Selection,
              outputs: [],
              activeOutputName: "",
              editorError: null,
            };
          });
        }),

      updateGroupProperty: (fileId, path, key, value) =>
        set((state) =>
          mutateFiles(state.files, (files) => ({
            files: updateGroupAtPath({
              files,
              fileId,
              path,
              updater: (group) => applyOptionalProperty(group, key, value),
            }),
            selectedPresetId: "custom",
            outputs: [],
            activeOutputName: "",
            editorError: null,
          })),
        ),

      updateToken: (fileId, path, updater) =>
        set((state) =>
          mutateFiles(state.files, (files) => ({
            files: updateTokenAtPath({ files, fileId, path, updater }),
            selectedPresetId: "custom",
            outputs: [],
            activeOutputName: "",
            editorError: null,
          })),
        ),

      createCustomType: (name, defaultValue) =>
        set((state) => {
          const trimmedName = name.trim();
          const nameError = validateCustomTokenTypeName(
            trimmedName,
            state.customTypes,
          );

          if (nameError) {
            return { editorError: nameError };
          }

          return {
            customTypes: [
              ...state.customTypes,
              {
                name: trimmedName,
                defaultValue: structuredClone(defaultValue),
              },
            ],
            selectedPresetId: "custom",
            editorError: null,
          };
        }),

      updateCustomType: (currentName, nextName, defaultValue) =>
        set((state) => {
          const trimmedName = nextName.trim();
          const nameError = validateCustomTokenTypeName(
            trimmedName,
            state.customTypes,
            currentName,
          );

          if (nameError) {
            return { editorError: nameError };
          }

          return {
            customTypes: state.customTypes.map((type) =>
              type.name === currentName
                ? {
                    name: trimmedName,
                    defaultValue: structuredClone(defaultValue),
                  }
                : type,
            ),
            files:
              currentName === trimmedName
                ? state.files
                : renameTokenTypeInFiles(state.files, currentName, trimmedName),
            selectedPresetId: "custom",
            outputs: [],
            activeOutputName: "",
            editorError: null,
          };
        }),

      deleteCustomType: (name) =>
        set((state) => ({
          customTypes: state.customTypes.filter((type) => type.name !== name),
          selectedPresetId: "custom",
          editorError: null,
        })),

      updateTransform: (settings) =>
        set((state) => ({
          transform: { ...state.transform, ...settings },
          buildError: null,
        })),

      setOutputs: (outputs) =>
        set({
          outputs,
          activeOutputName: outputs[0]?.name ?? "",
          buildError: null,
        }),

      setValidationErrors: (errors) => set({ validationErrors: errors }),

      setBuildError: (message) => set({ buildError: message, outputs: [] }),

      clearMessages: () =>
        set({ validationErrors: [], buildError: null, editorError: null }),
    }),
    {
      name: "tokun-editor-workspace",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        files: state.files,
        customTypes: state.customTypes,
        selectedPresetId: state.selectedPresetId,
        selected: state.selected,
        transform: state.transform,
      }),
    },
  ),
);

export function selectMergedDocument() {
  return mergeDocuments(useEditorStore.getState().files);
}

export function getOutputName(format: string): string {
  return outputNameByFormat[format] ?? "tokens.out";
}

function mutateFiles(
  files: TokenFile[],
  callback: (nextFiles: TokenFile[]) => Partial<EditorStore>,
): Partial<EditorStore> {
  try {
    return callback(structuredClone(files));
  } catch (error) {
    return { editorError: getErrorMessage(error) };
  }
}

function requireFile(files: TokenFile[], fileId: string): TokenFile {
  const file = getFile(files, fileId);

  if (!file) {
    throw new Error("Selected file was not found.");
  }

  return file;
}

function requireGroup(
  file: TokenFile,
  path: string[],
): Record<string, unknown> {
  const group = getGroupAtPath(file.document, path);

  if (!group) {
    throw new Error("Selected group was not found.");
  }

  return group;
}

function requireParentGroup(
  file: TokenFile,
  path: string[],
): Record<string, unknown> {
  const parentGroup = getParentGroup(file.document, path);

  if (!parentGroup) {
    throw new Error("Selected parent group was not found.");
  }

  return parentGroup;
}

function requireLastPathSegment(path: string[], kind: string): string {
  const segment = path.at(-1);

  if (!segment) {
    throw new Error(`Selected ${kind} was not found.`);
  }

  return segment;
}

function applyOptionalProperty(
  target: Record<string, unknown>,
  key: string,
  value: unknown,
): Record<string, unknown> {
  const next = { ...target };

  if (value === undefined || value === "") {
    delete next[key];
  } else {
    next[key] = value;
  }

  return next;
}

function renameTokenTypeInFiles(
  files: TokenFile[],
  currentName: string,
  nextName: string,
): TokenFile[] {
  const nextFiles = structuredClone(files);

  for (const file of nextFiles) {
    renameTokenTypeInGroup(file.document, currentName, nextName);
  }

  return nextFiles;
}

function renameTokenTypeInGroup(
  group: Record<string, unknown>,
  currentName: string,
  nextName: string,
): void {
  for (const value of Object.values(group)) {
    if (!isRecord(value)) {
      continue;
    }

    if (isTokenWithType(value, currentName)) {
      value.$type = nextName;
      continue;
    }

    renameTokenTypeInGroup(value, currentName, nextName);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTokenWithType(
  value: Record<string, unknown>,
  type: string,
): value is Record<string, unknown> & { $type: string } {
  return Object.hasOwn(value, "$value") && value.$type === type;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return "Unable to update token workspace.";
}

export function validateRename(
  value: string,
  allowRootToken = false,
): string | null {
  return validateNodeName(value, { allowRootToken });
}

export function getSelectedToken(files: TokenFile[], selection: Selection) {
  if (selection.kind !== "token") {
    return null;
  }

  const file = getFile(files, selection.fileId);
  return file ? getTokenAtPath(file.document, selection.path) : null;
}

export function getSelectedGroup(files: TokenFile[], selection: Selection) {
  if (selection.kind !== "group" && selection.kind !== "file") {
    return null;
  }

  const file = getFile(files, selection.fileId);
  return file ? getGroupAtPath(file.document, selection.path) : null;
}
