import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import {
  getAvailableTokenTypes,
  getFile,
  getGroupAtPath,
  isRecord,
  pathToLabel,
} from "@/lib/token-documents";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useEditorStore, validateRename } from "./editor-store";

const noInheritedTypeValue = "__no_inherited_type__";

export function GroupAttributesDialog({
  fileId,
  path,
  open,
  onOpenChange,
}: {
  fileId: string;
  path: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const files = useEditorStore((state) => state.files);
  const customTypes = useEditorStore((state) => state.customTypes);
  const renameGroup = useEditorStore((state) => state.renameGroup);
  const updateGroupProperty = useEditorStore(
    (state) => state.updateGroupProperty,
  );
  const file = getFile(files, fileId);
  const group = file ? getGroupAtPath(file.document, path) : null;
  const currentName = path.at(-1) ?? "Root";
  const [name, setName] = useState(currentName);
  const [type, setType] = useState("");
  const [schema, setSchema] = useState("");
  const [extendsValue, setExtendsValue] = useState("");
  const [description, setDescription] = useState("");
  const [deprecated, setDeprecated] = useState("");
  const [extensionsText, setExtensionsText] = useState("");
  const [extensionsError, setExtensionsError] = useState<string | null>(null);
  const renameError = useMemo(
    () => (path.length === 0 ? null : validateRename(name)),
    [name, path.length],
  );
  const availableTokenTypes = getAvailableTokenTypes(customTypes);

  useEffect(() => {
    if (!group) {
      return;
    }

    setName(currentName);
    setType(typeof group.$type === "string" ? group.$type : "");
    setSchema(typeof group.$schema === "string" ? group.$schema : "");
    setExtendsValue(typeof group.$extends === "string" ? group.$extends : "");
    setDescription(
      typeof group.$description === "string" ? group.$description : "",
    );
    setDeprecated(formatDeprecatedValue(group.$deprecated));
    setExtensionsText(
      isRecord(group.$extensions)
        ? JSON.stringify(group.$extensions, null, 2)
        : "",
    );
    setExtensionsError(null);
  }, [currentName, group, open]);

  const save = () => {
    if (!file || !group || renameError) {
      return;
    }

    let parsedExtensions: Record<string, unknown> | undefined;

    try {
      parsedExtensions = extensionsText.trim()
        ? (JSON.parse(extensionsText) as unknown as Record<string, unknown>)
        : undefined;

      if (parsedExtensions !== undefined && !isRecord(parsedExtensions)) {
        setExtensionsError("$extensions must be a JSON object.");
        return;
      }
    } catch (error) {
      setExtensionsError(
        error instanceof Error ? error.message : "Invalid JSON.",
      );
      return;
    }

    const trimmedName = name.trim();
    const nextPath =
      path.length > 0 && trimmedName !== currentName
        ? [...path.slice(0, -1), trimmedName]
        : path;

    if (path.length > 0 && trimmedName !== currentName) {
      renameGroup(file.id, path, trimmedName);
    }

    updateGroupProperty(file.id, nextPath, "$schema", schema);
    updateGroupProperty(file.id, nextPath, "$type", type);
    updateGroupProperty(file.id, nextPath, "$extends", extendsValue);
    updateGroupProperty(file.id, nextPath, "$description", description);
    updateGroupProperty(
      file.id,
      nextPath,
      "$deprecated",
      parseDeprecatedValue(deprecated),
    );
    updateGroupProperty(file.id, nextPath, "$extensions", parsedExtensions);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Group attributes</DialogTitle>
          <DialogDescription>
            Edit metadata for <code>{pathToLabel(path)}</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {path.length > 0 ? (
            <Field label="Group name">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              {renameError ? (
                <p className="text-destructive text-xs">{renameError}</p>
              ) : null}
            </Field>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="$type">
              <Select
                value={type || noInheritedTypeValue}
                onValueChange={(value) =>
                  setType(value === noInheritedTypeValue ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No inherited type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={noInheritedTypeValue}>
                    No inherited type
                  </SelectItem>
                  {availableTokenTypes.map((tokenType) => (
                    <SelectItem key={tokenType} value={tokenType}>
                      {tokenType}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="$schema">
              <Input
                value={schema}
                onChange={(event) => setSchema(event.target.value)}
              />
            </Field>
          </div>

          <Field label="$extends">
            <Input
              value={extendsValue}
              placeholder="{base.group} or #/base/group"
              onChange={(event) => setExtendsValue(event.target.value)}
            />
          </Field>

          <Field label="$description">
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <Field label="$deprecated">
            <Input
              value={deprecated}
              placeholder="true, false, or reason"
              onChange={(event) => setDeprecated(event.target.value)}
            />
          </Field>

          <Field label="$extensions">
            <Textarea
              className="min-h-28 font-mono text-xs"
              value={extensionsText}
              placeholder="{}"
              onChange={(event) => setExtensionsText(event.target.value)}
            />
            {extensionsError ? (
              <p className="text-destructive text-xs">{extensionsError}</p>
            ) : null}
          </Field>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={Boolean(renameError)} onClick={save}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function formatDeprecatedValue(value: unknown): string {
  return typeof value === "string" || typeof value === "boolean"
    ? String(value)
    : "";
}

function parseDeprecatedValue(value: string): string | boolean | undefined {
  if (value === "") {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return value;
}
