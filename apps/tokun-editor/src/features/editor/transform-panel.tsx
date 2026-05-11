import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  mergeDocuments,
  validateCustomTokenTypeName,
} from "@/lib/token-documents";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Play,
  Settings2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { build, formatNames } from "tokun/browser";
import { dtcgValidator, type TypeValidators } from "tokun/validators";
import {
  getOutputName,
  useEditorStore,
  type BuildOutput,
} from "./editor-store";

export function TransformPanel() {
  const files = useEditorStore((state) => state.files);
  const customTypes = useEditorStore((state) => state.customTypes);
  const transform = useEditorStore((state) => state.transform);
  const outputs = useEditorStore((state) => state.outputs);
  const validationErrors = useEditorStore((state) => state.validationErrors);
  const buildError = useEditorStore((state) => state.buildError);
  const updateTransform = useEditorStore((state) => state.updateTransform);
  const setOutputs = useEditorStore((state) => state.setOutputs);
  const setValidationErrors = useEditorStore(
    (state) => state.setValidationErrors,
  );
  const setBuildError = useEditorStore((state) => state.setBuildError);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">(
    "idle",
  );
  const [customTypesOpen, setCustomTypesOpen] = useState(false);

  const activeOutput = outputs[0];
  const status = useMemo(() => {
    if (buildError || validationErrors.length > 0) {
      return { label: "Action needed", tone: "error" as const };
    }

    if (activeOutput) {
      return { label: "Output ready", tone: "success" as const };
    }

    return { label: "Ready", tone: "neutral" as const };
  }, [activeOutput, buildError, validationErrors.length]);

  const runValidation = () => {
    try {
      const result = dtcgValidator(structuredClone(mergeDocuments(files)), {
        types: createCustomTypeValidators(customTypes.map((type) => type.name)),
      });
      setValidationErrors(result.errors);
      setBuildError(null);
    } catch (error) {
      setBuildError(getErrorMessage(error, "Validation failed."));
    }
  };

  const runBuild = () => {
    try {
      const result = build({
        data: structuredClone(mergeDocuments(files)),
        options: {
          loader: "dtcg-json",
          platforms: [
            {
              name: "tokun-editor",
              format: transform.format,
              transforms:
                transform.format === "css" || transform.format === "scss"
                  ? ["kebab-case", "css-transforms"]
                  : [],
              outputs: [{ name: getOutputName(transform.format) }],
              config: {
                outputReferences: transform.outputReferences,
                selector: transform.selector,
                prefix: transform.prefix,
              },
            },
          ],
        },
      }) satisfies BuildOutput[];

      setOutputs(result);
      setValidationErrors([]);

      if (result.length === 0) {
        setBuildError("Build completed, but tokun returned no output files.");
      }
    } catch (error) {
      setBuildError(getErrorMessage(error, "Build failed."));
    }
  };

  const copyOutput = async () => {
    if (!activeOutput) {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeOutput.content);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1200);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1200);
    }
  };

  return (
    <Card className="min-h-[32rem]">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>Transform</CardTitle>
            <CardDescription>
              Validate and generate CSS, SCSS, or JSON with tokun.
            </CardDescription>
          </div>
          <Badge
            variant={status.tone === "error" ? "destructive" : "secondary"}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <Field label="Format">
            <Select
              value={transform.format}
              onValueChange={(format) => updateTransform({ format })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formatNames.map((format) => (
                  <SelectItem key={format} value={format}>
                    {format}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CSS selector">
              <Input
                value={transform.selector}
                onChange={(event) =>
                  updateTransform({ selector: event.target.value })
                }
                disabled={transform.format !== "css"}
              />
            </Field>
            <Field label="Variable prefix">
              <Input
                value={transform.prefix}
                onChange={(event) =>
                  updateTransform({ prefix: event.target.value })
                }
                disabled={transform.format !== "css"}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={transform.outputReferences}
              onChange={(event) =>
                updateTransform({ outputReferences: event.target.checked })
              }
            />
            Output references when supported
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={runBuild}>
            <Play size={14} />
            Build
          </Button>
          <Button type="button" variant="secondary" onClick={runValidation}>
            <ShieldCheck size={14} />
            Validate
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setCustomTypesOpen(true)}
          >
            <Settings2 size={14} />
            Custom types
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={copyOutput}
            disabled={!activeOutput}
          >
            <Copy size={14} />
            {copyState === "copied"
              ? "Copied"
              : copyState === "failed"
                ? "Copy failed"
                : "Copy"}
          </Button>
        </div>

        <CustomTypesDialog
          open={customTypesOpen}
          onOpenChange={setCustomTypesOpen}
        />

        <Messages
          buildError={buildError}
          validationErrors={validationErrors}
          hasOutput={Boolean(activeOutput)}
        />

        <Separator />

        <div className="bg-muted/70 rounded-xl border p-3">
          {activeOutput ? (
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
                <span>{activeOutput.name}</span>
                <span>{activeOutput.content.length} characters</span>
              </div>
              <pre className="bg-background max-h-[32rem] overflow-auto rounded-lg p-3 text-xs leading-relaxed">
                <code>{activeOutput.content}</code>
              </pre>
            </div>
          ) : (
            <div className="text-muted-foreground flex min-h-80 items-center justify-center text-center text-sm">
              Build tokens to preview generated output.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Messages({
  buildError,
  validationErrors,
  hasOutput,
}: {
  buildError: string | null;
  validationErrors: { name: string; path: string; message: string }[];
  hasOutput: boolean;
}) {
  if (buildError) {
    return (
      <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
        <div className="flex gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{buildError}</span>
        </div>
      </div>
    );
  }

  if (validationErrors.length > 0) {
    return (
      <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
        <div className="flex items-center gap-2 font-medium">
          <AlertCircle size={16} />
          {validationErrors.length} validation issue
          {validationErrors.length === 1 ? "" : "s"}
        </div>
        <div className="max-h-48 space-y-2 overflow-auto">
          {validationErrors.map((error, index) => (
            <div
              key={`${error.path}-${error.name}-${index}`}
              className="bg-background rounded-md border p-2"
            >
              <p className="font-medium">{error.message}</p>
              <p className="text-muted-foreground mt-1 text-xs">
                <code>{error.path}</code> | {error.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (hasOutput) {
    return (
      <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} />
          Output generated successfully.
        </div>
      </div>
    );
  }

  return null;
}

function CustomTypesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const customTypes = useEditorStore((state) => state.customTypes);
  const createCustomType = useEditorStore((state) => state.createCustomType);
  const updateCustomType = useEditorStore((state) => state.updateCustomType);
  const deleteCustomType = useEditorStore((state) => state.deleteCustomType);
  const [name, setName] = useState("");
  const [defaultValueText, setDefaultValueText] = useState('""');
  const [error, setError] = useState<string | null>(null);

  const saveNewType = () => {
    const parsed = parseDefaultValue(defaultValueText, setError);

    if (parsed === undefined) {
      return;
    }

    const nameError = validateCustomTokenTypeName(name, customTypes);

    if (nameError) {
      setError(nameError);
      return;
    }

    createCustomType(name, parsed);
    setName("");
    setDefaultValueText('""');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Custom token types</DialogTitle>
          <DialogDescription>
            Define editor-only token types with JSON default values. Custom
            values use the generic JSON editor and are included in workspace
            exports.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
            <Field label="Type name">
              <Input
                value={name}
                placeholder="asset"
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field label="Default value JSON">
              <Input
                value={defaultValueText}
                placeholder='""'
                onChange={(event) => setDefaultValueText(event.target.value)}
              />
            </Field>
            <Button type="button" onClick={saveNewType}>
              Add type
            </Button>
          </div>

          {customTypes.length > 0 ? (
            <div className="space-y-3">
              {customTypes.map((type) => (
                <CustomTypeRow
                  key={type.name}
                  typeName={type.name}
                  defaultValue={type.defaultValue}
                  customTypes={customTypes}
                  onSave={updateCustomType}
                  onDelete={deleteCustomType}
                />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-sm">
              No custom types yet.
            </p>
          )}

          {error ? (
            <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CustomTypeRow({
  typeName,
  defaultValue,
  customTypes,
  onSave,
  onDelete,
}: {
  typeName: string;
  defaultValue: unknown;
  customTypes: { name: string; defaultValue: unknown }[];
  onSave: (
    currentName: string,
    nextName: string,
    defaultValue: unknown,
  ) => void;
  onDelete: (name: string) => void;
}) {
  const [name, setName] = useState(typeName);
  const [text, setText] = useState(() => JSON.stringify(defaultValue, null, 2));
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    const parsed = parseDefaultValue(text, setError);

    if (parsed === undefined) {
      return;
    }

    const nameError = validateCustomTokenTypeName(name, customTypes, typeName);

    if (nameError) {
      setError(nameError);
      return;
    }

    onSave(typeName, name, parsed);
    setError(null);
  };

  return (
    <div className="rounded-lg border p-3">
      <div className="grid gap-3 sm:grid-cols-[12rem_1fr_auto_auto] sm:items-start">
        <Field label="Type name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="Default value JSON">
          <Textarea
            className="min-h-20 font-mono text-xs"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
        </Field>
        <Button type="button" variant="secondary" onClick={save}>
          Save
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={() => onDelete(typeName)}
        >
          <Trash2 size={14} />
        </Button>
      </div>
      {error ? <p className="text-destructive mt-2 text-xs">{error}</p> : null}
    </div>
  );
}

function parseDefaultValue(
  text: string,
  setError: (message: string | null) => void,
): unknown | undefined {
  try {
    setError(null);
    return JSON.parse(text) as unknown;
  } catch (error) {
    setError(error instanceof Error ? error.message : "Invalid JSON.");
    return undefined;
  }
}

function createCustomTypeValidators(typeNames: string[]): TypeValidators {
  return Object.fromEntries(
    typeNames.map((typeName) => [
      typeName,
      {
        validator: (token: unknown) =>
          typeof token === "object" &&
          token !== null &&
          Object.hasOwn(token, "$value"),
      },
    ]),
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}
