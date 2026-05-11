import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  defaultTokenValue,
  getAvailableTokenTypes,
  getFile,
  getGroupAtPath,
  getTokenAtPath,
  isRecord,
  pathToLabel,
  tokenPathToReferencePath,
  type Selection,
  type TokenObject,
} from "@/lib/token-documents";
import { FileJson2, Layers3, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useEditorStore, validateRename } from "./editor-store";
import { TokenValueEditor } from "./token-value-editor";

const noInheritedTypeValue = "__no_inherited_type__";

export function NodeEditor() {
  const files = useEditorStore((state) => state.files);
  const customTypes = useEditorStore((state) => state.customTypes);
  const selected = useEditorStore((state) => state.selected);
  const editorError = useEditorStore((state) => state.editorError);
  const file = getFile(files, selected.fileId);
  const availableTokenTypes = getAvailableTokenTypes(customTypes);

  if (!file) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No file selected</CardTitle>
          <CardDescription>
            Create or import a token file to begin.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="min-h-[32rem]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Token Structure</CardTitle>
            <CardDescription>
              Edit files, groups, tokens, and DTCG attributes.
            </CardDescription>
          </div>
          <Badge variant="secondary">{file.path}</Badge>
        </div>
        {editorError ? (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
            {editorError}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {selected.kind === "file" ? (
          <FileEditor selection={selected} />
        ) : selected.kind === "group" ? (
          <GroupEditor
            selection={selected}
            availableTokenTypes={availableTokenTypes}
          />
        ) : (
          <TokenEditor
            selection={selected}
            availableTokenTypes={availableTokenTypes}
          />
        )}
      </CardContent>
    </Card>
  );
}

function FileEditor({
  selection,
}: {
  selection: Extract<Selection, { kind: "file" }>;
}) {
  const files = useEditorStore((state) => state.files);
  const renameFile = useEditorStore((state) => state.renameFile);
  const deleteFile = useEditorStore((state) => state.deleteFile);
  const createGroup = useEditorStore((state) => state.createGroup);
  const createToken = useEditorStore((state) => state.createToken);
  const file = getFile(files, selection.fileId);
  const [path, setPath] = useState(file?.path ?? "");

  useEffect(() => {
    setPath(file?.path ?? "");
  }, [file?.path]);

  if (!file) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <FileJson2 size={20} />
        <div>
          <h2 className="text-xl font-semibold">File</h2>
          <p className="text-muted-foreground text-sm">
            File paths create the sidebar file structure. Token references stay
            based on token paths, not file paths.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="File path">
          <Input
            value={path}
            onChange={(event) => setPath(event.target.value)}
          />
        </Field>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => renameFile(file.id, path)}
          >
            Rename
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteFile(file.id)}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      </div>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => createGroup(file.id, [])}>
          <Plus size={14} />
          Root group
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => createToken(file.id, [])}
        >
          <Plus size={14} />
          Root token
        </Button>
      </div>
    </div>
  );
}

function GroupEditor({
  selection,
  availableTokenTypes,
}: {
  selection: Extract<Selection, { kind: "group" }>;
  availableTokenTypes: string[];
}) {
  const files = useEditorStore((state) => state.files);
  const renameGroup = useEditorStore((state) => state.renameGroup);
  const deleteGroup = useEditorStore((state) => state.deleteGroup);
  const createGroup = useEditorStore((state) => state.createGroup);
  const createToken = useEditorStore((state) => state.createToken);
  const updateGroupProperty = useEditorStore(
    (state) => state.updateGroupProperty,
  );
  const file = getFile(files, selection.fileId);
  const group = file ? getGroupAtPath(file.document, selection.path) : null;
  const currentName = selection.path.at(-1) ?? "root";
  const [name, setName] = useState(currentName);
  const renameError = useMemo(
    () => (selection.path.length === 0 ? null : validateRename(name)),
    [name, selection.path.length],
  );

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  if (!file || !group) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Layers3 size={20} />
        <div>
          <h2 className="text-xl font-semibold">
            {pathToLabel(selection.path)}
          </h2>
          <p className="text-muted-foreground text-sm">
            Group metadata is inherited by child tokens according to DTCG rules.
          </p>
        </div>
      </div>

      {selection.path.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="Group name">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {renameError ? (
              <p className="text-destructive text-xs">{renameError}</p>
            ) : null}
          </Field>
          <div className="flex items-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(renameError)}
              onClick={() => renameGroup(file.id, selection.path, name)}
            >
              Rename
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleteGroup(file.id, selection.path)}
            >
              <Trash2 size={14} />
              Delete
            </Button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="$type">
          <Select
            value={
              typeof group.$type === "string" && group.$type.length > 0
                ? group.$type
                : noInheritedTypeValue
            }
            onValueChange={(value) =>
              updateGroupProperty(
                file.id,
                selection.path,
                "$type",
                value === noInheritedTypeValue ? "" : value,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="No inherited type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={noInheritedTypeValue}>
                No inherited type
              </SelectItem>
              {availableTokenTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="$extends">
          <Input
            value={typeof group.$extends === "string" ? group.$extends : ""}
            placeholder="{base.group} or #/base/group"
            onChange={(event) =>
              updateGroupProperty(
                file.id,
                selection.path,
                "$extends",
                event.target.value,
              )
            }
          />
        </Field>
      </div>

      <Field label="$description">
        <Textarea
          value={
            typeof group.$description === "string" ? group.$description : ""
          }
          onChange={(event) =>
            updateGroupProperty(
              file.id,
              selection.path,
              "$description",
              event.target.value,
            )
          }
        />
      </Field>

      <Separator />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={() => createGroup(file.id, selection.path)}
        >
          <Plus size={14} />
          Child group
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => createToken(file.id, selection.path)}
        >
          <Plus size={14} />
          Child token
        </Button>
      </div>
    </div>
  );
}

function TokenEditor({
  selection,
  availableTokenTypes,
}: {
  selection: Extract<Selection, { kind: "token" }>;
  availableTokenTypes: string[];
}) {
  const customTypes = useEditorStore((state) => state.customTypes);
  const files = useEditorStore((state) => state.files);
  const renameToken = useEditorStore((state) => state.renameToken);
  const deleteToken = useEditorStore((state) => state.deleteToken);
  const updateToken = useEditorStore((state) => state.updateToken);
  const file = getFile(files, selection.fileId);
  const token = file ? getTokenAtPath(file.document, selection.path) : null;
  const currentName = selection.path.at(-1) ?? "token";
  const [name, setName] = useState(currentName);
  const [extensionsText, setExtensionsText] = useState(() =>
    stringifyExtensions(token),
  );
  const [extensionsError, setExtensionsError] = useState<string | null>(null);
  const renameError = useMemo(() => validateRename(name, true), [name]);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  useEffect(() => {
    setExtensionsText(stringifyExtensions(token));
    setExtensionsError(null);
  }, [token]);

  if (!file || !token) {
    return null;
  }

  const tokenType = typeof token.$type === "string" ? token.$type : "";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">
            {pathToLabel(selection.path)}
          </h2>
          <p className="text-muted-foreground text-sm">
            Reference path:{" "}
            <code>{tokenPathToReferencePath(selection.path)}</code>
          </p>
        </div>
        <Badge>{tokenType || "untyped"}</Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Token name">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {renameError ? (
            <p className="text-destructive text-xs">{renameError}</p>
          ) : null}
        </Field>
        <div className="flex items-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={Boolean(renameError)}
            onClick={() => renameToken(file.id, selection.path, name)}
          >
            Rename
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => deleteToken(file.id, selection.path)}
          >
            <Trash2 size={14} />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Field label="$type">
          <Select
            value={tokenType}
            onValueChange={(value) => {
              const nextType = value;
              updateToken(file.id, selection.path, (currentToken) => ({
                ...currentToken,
                $type: nextType,
                $value: defaultTokenValue(nextType, customTypes),
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {availableTokenTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="$deprecated">
          <Input
            value={formatDeprecatedValue(token.$deprecated)}
            placeholder="true, false, or reason"
            onChange={(event) => {
              const nextValue = parseDeprecatedValue(event.target.value);
              updateToken(file.id, selection.path, (currentToken) =>
                applyTokenOptionalProperty(
                  currentToken,
                  "$deprecated",
                  nextValue,
                ),
              );
            }}
          />
        </Field>
      </div>

      <Field label="$description">
        <Textarea
          value={
            typeof token.$description === "string" ? token.$description : ""
          }
          onChange={(event) =>
            updateToken(file.id, selection.path, (currentToken) =>
              applyTokenOptionalProperty(
                currentToken,
                "$description",
                event.target.value,
              ),
            )
          }
        />
      </Field>

      <div className="bg-muted/40 rounded-xl border p-4">
        <TokenValueEditor
          type={tokenType}
          value={token.$value}
          onChange={(value) =>
            updateToken(file.id, selection.path, (currentToken) => ({
              ...currentToken,
              $value: value,
            }))
          }
        />
      </div>

      <Field label="$extensions">
        <Textarea
          className="min-h-32 font-mono text-xs"
          value={extensionsText}
          placeholder="{}"
          onChange={(event) => setExtensionsText(event.target.value)}
          onBlur={() => {
            try {
              const parsed = extensionsText.trim()
                ? (JSON.parse(extensionsText) as unknown)
                : undefined;

              if (parsed !== undefined && !isRecord(parsed)) {
                setExtensionsError("$extensions must be a JSON object.");
                return;
              }

              updateToken(file.id, selection.path, (currentToken) =>
                applyTokenOptionalProperty(currentToken, "$extensions", parsed),
              );
              setExtensionsError(null);
            } catch (error) {
              setExtensionsError(
                error instanceof Error ? error.message : "Invalid JSON.",
              );
            }
          }}
        />
        {extensionsError ? (
          <p className="text-destructive text-xs">{extensionsError}</p>
        ) : (
          <p className="text-muted-foreground text-xs">
            Dynamic extension data uses JSON because extension schemas are
            custom.
          </p>
        )}
      </Field>
    </div>
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

function stringifyExtensions(token: TokenObject | null): string {
  return token?.$extensions ? JSON.stringify(token.$extensions, null, 2) : "";
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

function applyTokenOptionalProperty(
  token: TokenObject,
  key: keyof TokenObject,
  value: unknown,
): TokenObject {
  const next = { ...token };

  if (value === undefined || value === "") {
    delete next[key];
  } else {
    next[key] = value;
  }

  return next;
}
