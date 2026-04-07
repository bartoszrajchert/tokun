import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Dropdown } from "./dropdown";

type PlaygroundControlsProps = {
  loader: string;
  format: string;
  loaderItems: string[];
  formatItems: string[];
  filesCount: number;
  isRunning: boolean;
  statusIsError: boolean;
  statusIsReady: boolean;
  statusText: string;
  onLoaderChange: (loader: string) => void;
  onFormatChange: (format: string) => void;
  onRun: () => void;
  onValidate: () => void;
};

export function PlaygroundControls({
  loader,
  format,
  loaderItems,
  formatItems,
  filesCount,
  isRunning,
  statusIsError,
  statusIsReady,
  statusText,
  onLoaderChange,
  onFormatChange,
  onRun,
  onValidate,
}: PlaygroundControlsProps) {
  return (
    <section className="bg-card/50 space-y-4 rounded-2xl border p-4 sm:p-5">
      <h2 className="text-xl font-semibold">Controls</h2>

      <div className="grid gap-3 md:grid-cols-2">
        <Dropdown
          id="playground-loader"
          label="Loader"
          placeholder="Select loader..."
          value={loader}
          setValue={onLoaderChange}
          items={loaderItems}
        />

        <Dropdown
          id="playground-format"
          label="Format"
          placeholder="Select format..."
          value={format}
          setValue={onFormatChange}
          items={formatItems}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={onRun}
          disabled={isRunning || !format || !loader || filesCount === 0}
        >
          {isRunning ? "Running..." : "Run"}
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={onValidate}
          disabled={filesCount === 0}
        >
          Validate
        </Button>

        <p
          className={cn(
            "ml-auto flex items-center gap-2 text-sm",
            statusIsError
              ? "text-destructive"
              : statusIsReady
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-foreground/70",
          )}
        >
          {statusIsError ? (
            <AlertCircle size={16} />
          ) : statusIsReady ? (
            <CheckCircle2 size={16} />
          ) : null}
          <span>{statusText}</span>
        </p>
      </div>
    </section>
  );
}
