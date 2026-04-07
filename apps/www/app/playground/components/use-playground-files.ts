import { useCallback, useMemo, useState } from "react";

import type { DropdownItem } from "./dropdown";
import { CUSTOM_PRESET_ID } from "./showcase-form.constants";
import type {
  InputFile,
  PlaygroundPreset,
  TreeDirectoryNode,
} from "./showcase-form.types";
import {
  buildFileTree,
  collectDirectoryPaths,
  createFileId,
  createNextFileName,
  splitFilePath,
  toInputFiles,
} from "./showcase-form.utils";

type ApplyPresetResult = "custom" | "applied" | "invalid";

type UsePlaygroundFilesArgs = {
  presets: PlaygroundPreset[];
};

export function usePlaygroundFiles({ presets }: UsePlaygroundFilesArgs) {
  const initialFiles = useMemo(
    () => toInputFiles(presets[0]?.files ?? []),
    [presets],
  );

  const [files, setFiles] = useState<InputFile[]>(initialFiles);
  const [activeFileId, setActiveFileId] = useState<string>(
    initialFiles[0]?.id ?? "",
  );
  const [expandedDirectories, setExpandedDirectories] = useState<Set<string>>(
    () => new Set(collectDirectoryPaths(initialFiles)),
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    presets[0]?.id ?? "",
  );

  const activePreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId) ?? null,
    [presets, selectedPresetId],
  );

  const activeFile = useMemo(
    () => files.find((file) => file.id === activeFileId) ?? files[0],
    [activeFileId, files],
  );

  const fileTree = useMemo<TreeDirectoryNode>(
    () => buildFileTree(files),
    [files],
  );

  const presetOptions = useMemo<DropdownItem[]>(
    () => [
      ...presets.map((preset) => ({
        value: preset.id,
        label: preset.label,
      })),
      {
        value: CUSTOM_PRESET_ID,
        label: "Custom",
      },
    ],
    [presets],
  );

  const activeDirectory = useMemo(() => {
    const parts = splitFilePath(activeFile?.name ?? "");
    return parts.slice(0, -1).join("/");
  }, [activeFile?.name]);

  const toggleDirectory = useCallback((path: string) => {
    setExpandedDirectories((previous) => {
      const next = new Set(previous);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const markAsCustom = useCallback(() => {
    setSelectedPresetId((previous) =>
      previous === CUSTOM_PRESET_ID ? previous : CUSTOM_PRESET_ID,
    );
  }, []);

  const applyPreset = useCallback(
    (presetId: string): ApplyPresetResult => {
      if (presetId === CUSTOM_PRESET_ID) {
        setSelectedPresetId(CUSTOM_PRESET_ID);
        return "custom";
      }

      const preset = presets.find((item) => item.id === presetId);

      if (!preset) {
        return "invalid";
      }

      const nextFiles = toInputFiles(preset.files);
      setSelectedPresetId(presetId);
      setFiles(nextFiles);
      setActiveFileId(nextFiles[0]?.id ?? "");
      setExpandedDirectories(new Set(collectDirectoryPaths(nextFiles)));
      return "applied";
    },
    [presets],
  );

  const addFile = useCallback(() => {
    const newFile: InputFile = {
      id: createFileId(),
      name: createNextFileName(files, activeDirectory),
      content: "{}",
    };

    const nextFiles = [...files, newFile];

    setFiles(nextFiles);
    setExpandedDirectories((previous) => {
      const next = new Set(previous);
      collectDirectoryPaths(nextFiles).forEach((path) => next.add(path));
      return next;
    });
    setActiveFileId(newFile.id);
  }, [activeDirectory, files]);

  const removeActiveFile = useCallback(() => {
    if (files.length <= 1) {
      return;
    }

    const activeIndex = files.findIndex((file) => file.id === activeFileId);
    const nextFiles = files.filter((file) => file.id !== activeFileId);
    const nextActiveIndex = activeIndex > 0 ? activeIndex - 1 : 0;

    setFiles(nextFiles);
    setActiveFileId(nextFiles[nextActiveIndex]?.id ?? nextFiles[0]?.id ?? "");
  }, [activeFileId, files]);

  const updateActiveFileName = useCallback(
    (name: string) => {
      const nextFiles = files.map((file) =>
        file.id === activeFileId ? { ...file, name } : file,
      );

      setFiles(nextFiles);
      setExpandedDirectories((previous) => {
        const next = new Set(previous);
        collectDirectoryPaths(nextFiles).forEach((path) => next.add(path));
        return next;
      });
    },
    [activeFileId, files],
  );

  const updateActiveFileContent = useCallback(
    (content: string) => {
      setFiles((previous) =>
        previous.map((file) =>
          file.id === activeFileId ? { ...file, content } : file,
        ),
      );
    },
    [activeFileId],
  );

  return {
    files,
    fileTree,
    activeFile,
    activeFileId,
    activeDirectory,
    expandedDirectories,
    selectedPresetId,
    activePreset,
    presetOptions,
    setActiveFileId,
    toggleDirectory,
    markAsCustom,
    applyPreset,
    addFile,
    removeActiveFile,
    updateActiveFileName,
    updateActiveFileContent,
  };
}
