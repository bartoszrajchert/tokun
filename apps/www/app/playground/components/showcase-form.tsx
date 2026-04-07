"use client";

import { InputFilesPanel } from "./input-files-panel";
import { OutputPanel } from "./output-panel";
import { PlaygroundControls } from "./playground-controls";
import type { PlaygroundPreset } from "./showcase-form.types";
import { useShowcaseFormState } from "./use-showcase-form-state";

export default function ShowcaseForm({
  presets,
}: {
  presets: PlaygroundPreset[];
}) {
  const state = useShowcaseFormState({ presets });

  return (
    <div className="space-y-2">
      <PlaygroundControls
        loader={state.loader}
        format={state.format}
        loaderItems={[...state.loaderItems]}
        formatItems={[...state.formatItems]}
        filesCount={state.files.length}
        isRunning={state.isRunning}
        statusIsError={state.statusIsError}
        statusIsReady={state.statusIsReady}
        statusText={state.statusText}
        onLoaderChange={state.setLoader}
        onFormatChange={state.setFormat}
        onRun={state.handleRun}
        onValidate={state.handleValidate}
      />

      <div className="grid gap-2 xl:grid-cols-2">
        <InputFilesPanel
          files={state.files}
          fileTree={state.fileTree}
          expandedDirectories={state.expandedDirectories}
          selectedPresetId={state.selectedPresetId}
          presetOptions={state.presetOptions}
          activePreset={state.activePreset}
          activeFile={state.activeFile}
          lineCount={state.lineCount}
          inputErrorFileId={state.inputError?.fileId}
          onPresetChange={state.handlePresetChange}
          onToggleDirectory={state.toggleDirectory}
          onSelectFile={state.setActiveFileId}
          onAddFile={state.handleAddFile}
          onRemoveFile={state.handleRemoveFile}
          onFileNameChange={state.handleFileNameChange}
          onFileContentChange={state.handleFileContentChange}
        />

        <OutputPanel
          activeOutput={state.activeOutput}
          activeOutputName={state.activeOutputName}
          outputs={state.outputs}
          copyLabel={state.copyLabel}
          inputError={state.inputError}
          buildError={state.buildError}
          validationRan={state.validationRan}
          validationErrors={state.validationErrors}
          onCopyOutput={state.handleCopyOutput}
          onOutputNameChange={state.setActiveOutputName}
        />
      </div>
    </div>
  );
}
