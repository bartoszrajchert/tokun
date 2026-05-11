import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEditorStore } from "@/features/editor/editor-store";
import { editorPresets } from "@/lib/presets";
import {
  createBlankWorkspaceFiles,
  readWorkspaceFile,
} from "@/lib/workspace-files";
import { FilePlus2, FolderOpen, Sparkles, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";

export function IntroPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const loadPreset = useEditorStore((state) => state.loadPreset);
  const replaceFiles = useEditorStore((state) => state.replaceFiles);
  const [error, setError] = useState<string | null>(null);

  const openStudio = () => navigate("/studio");

  const handlePreset = (presetId: string) => {
    loadPreset(presetId);
    openStudio();
  };

  const handleBlank = () => {
    replaceFiles(createBlankWorkspaceFiles(), "blank");
    openStudio();
  };

  const handleUpload = async (file: File) => {
    try {
      const workspace = await readWorkspaceFile(file);
      replaceFiles(workspace.files, "custom", workspace.customTypes);
      openStudio();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to import selected token file.",
      );
    }
  };

  return (
    <main className="min-h-dvh px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-primary flex items-center gap-2 text-sm font-medium">
              <Sparkles size={16} />
              Tokun Editor
            </p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Start with tokens, a file, or a blank workspace.
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl text-base">
              Choose a preset, upload your design tokens, or create an empty
              file before entering the editor.
            </p>
          </div>
          <ModeToggle />
        </header>

        {error ? (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {editorPresets.map((preset) => (
            <Card key={preset.id} className="flex flex-col">
              <CardHeader>
                <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-lg">
                  <FolderOpen size={20} />
                </div>
                <CardTitle>{preset.label}</CardTitle>
                <CardDescription>{preset.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button
                  className="w-full"
                  onClick={() => handlePreset(preset.id)}
                >
                  Use {preset.label.toLowerCase()}
                </Button>
              </CardContent>
            </Card>
          ))}

          <Card className="flex flex-col">
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-lg">
                <Upload size={20} />
              </div>
              <CardTitle>Upload tokens</CardTitle>
              <CardDescription>
                Import a token JSON file or an exported Tokun Editor workspace.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload JSON
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleUpload(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <div className="bg-primary/10 text-primary mb-3 flex size-10 items-center justify-center rounded-lg">
                <FilePlus2 size={20} />
              </div>
              <CardTitle>Blank workspace</CardTitle>
              <CardDescription>
                Create an empty token file and build your structure from
                scratch.
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button
                className="w-full"
                variant="secondary"
                onClick={handleBlank}
              >
                Create blank
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
