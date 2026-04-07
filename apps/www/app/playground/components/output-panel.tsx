import { Code } from "@/components/code";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import type { ValidatorError } from "tokun/validators";
import type { BuildOutput, InputParseError } from "./showcase-form.types";

type OutputPanelProps = {
  activeOutput?: BuildOutput;
  activeOutputName: string;
  outputs: BuildOutput[];
  copyLabel: string;
  inputError: InputParseError | null;
  buildError: string | null;
  validationRan: boolean;
  validationErrors: ValidatorError[];
  onCopyOutput: () => void;
  onOutputNameChange: (outputName: string) => void;
};

export function OutputPanel({
  activeOutput,
  activeOutputName,
  outputs,
  copyLabel,
  inputError,
  buildError,
  validationRan,
  validationErrors,
  onCopyOutput,
  onOutputNameChange,
}: OutputPanelProps) {
  return (
    <section className="bg-card/70 space-y-3 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <Label>Output</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCopyOutput}
          disabled={!activeOutput}
        >
          {copyLabel}
        </Button>
      </div>

      {inputError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Fix input file before running</p>
              <p>
                <span className="font-medium">{inputError.fileName}</span>:{" "}
                {inputError.message}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {!inputError && buildError ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-xl border px-4 py-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Build failed</p>
              <p>{buildError}</p>
            </div>
          </div>
        </div>
      ) : null}

      {validationRan && !inputError && validationErrors.length === 0 ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <div className="flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            <p>Validation passed. No DTCG issues found.</p>
          </div>
        </div>
      ) : null}

      {validationErrors.length > 0 ? (
        <div className="space-y-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle size={16} />
            <p>
              Validation found {validationErrors.length} issue
              {validationErrors.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="max-h-48 space-y-2 overflow-auto">
            {validationErrors.map((error, index) => (
              <div
                key={`${error.name}-${error.path}-${index}`}
                className="bg-background/85 rounded-md border p-3 text-sm"
              >
                <p className="font-medium">{error.message}</p>
                <p className="text-foreground/70 mt-1 text-xs">
                  Type: <code>{error.name}</code> | Path:{" "}
                  <code>{error.path}</code>
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {outputs.length > 1 ? (
        <div className="space-y-1">
          <Label htmlFor="playground-output-name">Output file</Label>
          <select
            id="playground-output-name"
            className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            value={activeOutputName}
            onChange={(event) => onOutputNameChange(event.target.value)}
          >
            {outputs.map((output) => (
              <option key={output.name} value={output.name}>
                {output.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="bg-muted min-h-[360px] overflow-auto rounded-xl border p-3 lg:min-h-[540px]">
        {activeOutput ? (
          <>
            <p className="text-foreground/60 pb-2 text-xs">
              {activeOutput.name}
            </p>
            <pre className="w-fit min-w-full">
              <Code>{activeOutput.content}</Code>
            </pre>
          </>
        ) : (
          <div className="text-foreground/60 flex h-full min-h-[330px] items-center justify-center text-sm lg:min-h-[510px]">
            Run the builder to see generated tokens.
          </div>
        )}
      </div>
    </section>
  );
}
