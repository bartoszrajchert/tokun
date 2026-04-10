import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dropdown, type DropdownItem } from "./dropdown";
import { FileTree } from "./file-tree";
import { CUSTOM_PRESET_ID } from "./showcase-form.constants";
import type {
  InputFile,
  PlaygroundPreset,
  TreeDirectoryNode,
} from "./showcase-form.types";

type InputFilesPanelProps = {
  files: InputFile[];
  fileTree: TreeDirectoryNode;
  expandedDirectories: Set<string>;
  selectedPresetId: string;
  presetOptions: DropdownItem[];
  activePreset: PlaygroundPreset | null;
  activeFile: InputFile | undefined;
  lineCount: number;
  inputErrorFileId?: string;
  onPresetChange: (presetId: string) => void;
  onToggleDirectory: (path: string) => void;
  onSelectFile: (fileId: string) => void;
  onAddFile: () => void;
  onRemoveFile: () => void;
  onFileNameChange: (name: string) => void;
  onFileContentChange: (content: string) => void;
};

export function InputFilesPanel({
  files,
  fileTree,
  expandedDirectories,
  selectedPresetId,
  presetOptions,
  activePreset,
  activeFile,
  lineCount,
  inputErrorFileId,
  onPresetChange,
  onToggleDirectory,
  onSelectFile,
  onAddFile,
  onRemoveFile,
  onFileNameChange,
  onFileContentChange,
}: InputFilesPanelProps) {
  const activeFileContent = activeFile?.content ?? "";

  return (
    <section className="bg-card/70 space-y-3 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <Label>Input files</Label>
        <p className="text-foreground/60 text-xs">
          {files.length} file{files.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="space-y-1">
        <Dropdown
          id="playground-preset"
          label="Preset"
          placeholder="Select preset..."
          value={selectedPresetId}
          setValue={onPresetChange}
          items={presetOptions}
        />
        <p className="text-foreground/60 text-xs">
          {selectedPresetId === CUSTOM_PRESET_ID
            ? "Custom switches on automatically when you edit files."
            : activePreset?.description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="bg-muted/40 space-y-3 rounded-xl border p-3">
          <div>
            <p className="text-foreground/60 text-xs uppercase tracking-wide">
              Directory tree
            </p>
          </div>

          <div className="max-h-[470px] overflow-auto pr-1">
            {fileTree.children.length > 0 ? (
              <FileTree
                nodes={fileTree.children}
                expandedDirectories={expandedDirectories}
                activeFileId={activeFile?.id ?? ""}
                errorFileId={inputErrorFileId}
                onToggleDirectory={onToggleDirectory}
                onSelectFile={onSelectFile}
              />
            ) : (
              <p className="text-foreground/60 px-2 py-2 text-sm">
                No files loaded.
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onAddFile}
            >
              Add file
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onRemoveFile}
              disabled={files.length <= 1}
            >
              Remove file
            </Button>
          </div>
        </aside>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="playground-file-name">Selected file path</Label>
            <p className="text-foreground/60 pb-1 text-xs">
              Use / in file paths to create folders.
            </p>
            <input
              id="playground-file-name"
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
              value={activeFile?.name ?? ""}
              onChange={(event) => onFileNameChange(event.target.value)}
              disabled={!activeFile}
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="playground-json">File content</Label>
            <p className="text-foreground/60 text-xs">
              {lineCount} lines | {activeFileContent.length} characters
            </p>
          </div>

          <Textarea
            id="playground-json"
            placeholder="Write your JSON here"
            className="min-h-[360px] font-mono text-sm leading-relaxed lg:min-h-[540px]"
            value={activeFileContent}
            onChange={(event) => onFileContentChange(event.target.value)}
            disabled={!activeFile}
          />
        </div>
      </div>
    </section>
  );
}
