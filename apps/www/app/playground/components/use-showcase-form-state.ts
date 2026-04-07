import { useCallback, useEffect, useMemo, useState } from "react";
import { build, formatNames, loaderNames } from "tokun/browser";
import { dtcgValidator, type ValidatorError } from "tokun/validators";

import { outputNameByFormat } from "./showcase-form.constants";
import type {
  BuildOutput,
  InputParseError,
  PlaygroundPreset,
} from "./showcase-form.types";
import {
  getErrorMessage,
  mergeParsedFiles,
  parseInputFiles,
} from "./showcase-form.utils";
import { usePlaygroundFiles } from "./use-playground-files";

type CopyState = "idle" | "copied" | "failed";

type UseShowcaseFormStateArgs = {
  presets: PlaygroundPreset[];
};

export function useShowcaseFormState({ presets }: UseShowcaseFormStateArgs) {
  const filesState = usePlaygroundFiles({ presets });
  const {
    files,
    fileTree,
    activeFile,
    activeFileId,
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
  } = filesState;

  const [outputs, setOutputs] = useState<BuildOutput[]>([]);
  const [activeOutputName, setActiveOutputName] = useState<string>("");
  const [format, setFormat] = useState<string>(formatNames[0] ?? "");
  const [loader, setLoader] = useState<string>(loaderNames[0] ?? "");

  const [inputError, setInputError] = useState<InputParseError | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidatorError[]>(
    [],
  );
  const [validationRan, setValidationRan] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");

  const activeOutput = useMemo(
    () =>
      outputs.find((output) => output.name === activeOutputName) ?? outputs[0],
    [activeOutputName, outputs],
  );

  const clearMessages = useCallback(() => {
    setInputError(null);
    setBuildError(null);
    setCopyState("idle");
  }, []);

  const resetResultState = useCallback(() => {
    setOutputs([]);
    setActiveOutputName("");
    setValidationErrors([]);
    setValidationRan(false);
    clearMessages();
  }, [clearMessages]);

  useEffect(() => {
    if (copyState === "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopyState("idle");
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [copyState]);

  const handlePresetChange = useCallback(
    (presetId: string) => {
      const result = applyPreset(presetId);

      if (result === "applied") {
        resetResultState();
      }
    },
    [applyPreset, resetResultState],
  );

  const handleAddFile = useCallback(() => {
    addFile();
    markAsCustom();
    clearMessages();
  }, [addFile, clearMessages, markAsCustom]);

  const handleRemoveFile = useCallback(() => {
    removeActiveFile();
    markAsCustom();
    clearMessages();
  }, [clearMessages, markAsCustom, removeActiveFile]);

  const handleFileNameChange = useCallback(
    (name: string) => {
      updateActiveFileName(name);
      markAsCustom();
      clearMessages();
    },
    [clearMessages, markAsCustom, updateActiveFileName],
  );

  const handleFileContentChange = useCallback(
    (content: string) => {
      updateActiveFileContent(content);
      markAsCustom();
      clearMessages();
    },
    [clearMessages, markAsCustom, updateActiveFileContent],
  );

  const handleRun = useCallback(() => {
    setIsRunning(true);
    setValidationErrors([]);
    setValidationRan(false);
    clearMessages();

    const { parsed, error } = parseInputFiles(files);

    if (error || parsed === null) {
      setInputError(error);
      setOutputs([]);
      setActiveOutputName("");
      setIsRunning(false);
      if (error) {
        setActiveFileId(error.fileId);
      }
      return;
    }

    if (!loader || !format) {
      setBuildError("Select both loader and format before running the build.");
      setOutputs([]);
      setActiveOutputName("");
      setIsRunning(false);
      return;
    }

    try {
      const result = build({
        data: parsed,
        options: {
          loader,
          platforms: [
            {
              name: "playground",
              format,
              transforms:
                format === "css" || format === "scss"
                  ? ["kebab-case", "css-transforms"]
                  : [],
              outputs: [{ name: outputNameByFormat[format] ?? "tokens.out" }],
            },
          ],
        },
      });

      setOutputs(result);
      setActiveOutputName(result[0]?.name ?? "");

      if (result.length === 0) {
        setBuildError("Build completed, but no output files were generated.");
      }
    } catch (error) {
      setOutputs([]);
      setActiveOutputName("");
      setBuildError(
        getErrorMessage(error, "Unable to build tokens with current settings."),
      );
    } finally {
      setIsRunning(false);
    }
  }, [clearMessages, files, format, loader, setActiveFileId]);

  const handleValidate = useCallback(() => {
    setValidationRan(true);
    setValidationErrors([]);
    clearMessages();

    const { parsed, error } = parseInputFiles(files);

    if (error || parsed === null) {
      setInputError(error);
      if (error) {
        setActiveFileId(error.fileId);
      }
      return;
    }

    try {
      const mergedData = mergeParsedFiles(parsed);
      const result = dtcgValidator(mergedData);
      setValidationErrors(result.errors);
    } catch (error) {
      setBuildError(
        getErrorMessage(error, "Validation failed due to an unexpected error."),
      );
    }
  }, [clearMessages, files, setActiveFileId]);

  const handleCopyOutput = useCallback(async () => {
    if (!activeOutput) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeOutput.content);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }, [activeOutput]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key !== "Enter") {
        return;
      }

      event.preventDefault();
      handleRun();
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [handleRun]);

  const statusIsError =
    inputError !== null || buildError !== null || validationErrors.length > 0;
  const statusIsReady = outputs.length > 0;
  const statusText = isRunning
    ? "Running build..."
    : statusIsError
      ? "Action needed"
      : statusIsReady
        ? "Output ready"
        : "Waiting for run";

  const lineCount = activeFile?.content
    ? activeFile.content.split("\n").length
    : 1;

  const copyLabel =
    copyState === "copied"
      ? "Copied"
      : copyState === "failed"
        ? "Copy failed"
        : "Copy output";

  return {
    loaderItems: loaderNames,
    formatItems: formatNames,
    files,
    fileTree,
    activeFile,
    activeFileId,
    expandedDirectories,
    selectedPresetId,
    activePreset,
    presetOptions,
    outputs,
    activeOutput,
    activeOutputName,
    format,
    loader,
    inputError,
    buildError,
    validationErrors,
    validationRan,
    isRunning,
    lineCount,
    copyLabel,
    statusIsError,
    statusIsReady,
    statusText,
    handlePresetChange,
    handleAddFile,
    handleRemoveFile,
    handleFileNameChange,
    handleFileContentChange,
    handleRun,
    handleValidate,
    handleCopyOutput,
    toggleDirectory,
    setLoader,
    setFormat,
    setActiveFileId,
    setActiveOutputName,
  };
}
