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
import { Textarea } from "@/components/ui/textarea";
import {
  collectTokenReferenceOptions,
  collectTokensForGroup,
  defaultTokenValue,
  getAvailableTokenTypes,
  getFile,
  isRecord,
  pathToLabel,
  tokenPathToReferencePath,
  type ListedToken,
  type Selection,
  type TokenObject,
} from "@/lib/token-documents";
import { cn } from "@/lib/utils";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useEditorStore, validateRename } from "./editor-store";
import { TokenValueControl } from "./token-value-fields";

const knownTokenAttributes = new Set([
  "$value",
  "$type",
  "$description",
  "$deprecated",
  "$extensions",
]);

export function TokenListPanel() {
  const files = useEditorStore((state) => state.files);
  const customTypes = useEditorStore((state) => state.customTypes);
  const selected = useEditorStore((state) => state.selected);
  const editorError = useEditorStore((state) => state.editorError);
  const createToken = useEditorStore((state) => state.createToken);
  const updateToken = useEditorStore((state) => state.updateToken);
  const activeFile = getFile(files, selected.fileId) ?? files[0];
  const groupPath = getSelectedGroupPath(selected);
  const tokens = activeFile ? collectTokensForGroup(activeFile, groupPath) : [];
  const referenceOptions = collectTokenReferenceOptions(files);
  const availableTokenTypes = getAvailableTokenTypes(customTypes);

  return (
    <Card className="min-h-[32rem]">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Tokens</CardTitle>
            <CardDescription>
              Inline-edit type and value for{" "}
              <code>{pathToLabel(groupPath)}</code> and child groups.
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={() => activeFile && createToken(activeFile.id, groupPath)}
            disabled={!activeFile}
          >
            <Plus size={14} />
            Token
          </Button>
        </div>
        {editorError ? (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-3 py-2 text-sm">
            {editorError}
          </div>
        ) : null}
      </CardHeader>
      <CardContent>
        {tokens.length > 0 ? (
          <div className="bg-background overflow-hidden rounded-xl border">
            <div className="bg-muted/60 text-muted-foreground grid grid-cols-[minmax(13rem,1.1fr)_9rem_minmax(18rem,1.6fr)_8rem] gap-3 border-b px-4 py-2 text-xs font-medium uppercase tracking-wide max-xl:hidden">
              <span>Token</span>
              <span>Type</span>
              <span>Value</span>
              <span>Attributes</span>
            </div>
            <div className="divide-y">
              {tokens.map((listedToken) => (
                <TokenRow
                  key={`${listedToken.fileId}:${listedToken.path.join(".")}`}
                  listedToken={listedToken}
                  availableTokenTypes={availableTokenTypes}
                  referenceOptions={referenceOptions.filter(
                    (option) =>
                      option.fileId !== listedToken.fileId ||
                      option.path.join(".") !== listedToken.path.join("."),
                  )}
                  onTypeChange={(type) =>
                    updateToken(
                      listedToken.fileId,
                      listedToken.path,
                      (token) => ({
                        ...token,
                        $type: type,
                        $value: defaultTokenValue(type, customTypes),
                      }),
                    )
                  }
                  onValueChange={(value) =>
                    updateToken(
                      listedToken.fileId,
                      listedToken.path,
                      (token) => ({
                        ...token,
                        $value: value,
                      }),
                    )
                  }
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-muted/30 flex min-h-80 flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
            <p className="text-lg font-medium">No tokens in this group scope</p>
            <p className="text-muted-foreground mt-1 max-w-md text-sm">
              Add a token to this group or select a parent group to include
              tokens from nested groups.
            </p>
            <Button
              type="button"
              className="mt-4"
              onClick={() =>
                activeFile && createToken(activeFile.id, groupPath)
              }
              disabled={!activeFile}
            >
              <Plus size={14} />
              Add token
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TokenRow({
  listedToken,
  availableTokenTypes,
  referenceOptions,
  onTypeChange,
  onValueChange,
}: {
  listedToken: ListedToken;
  availableTokenTypes: string[];
  referenceOptions: ReturnType<typeof collectTokenReferenceOptions>;
  onTypeChange: (type: string) => void;
  onValueChange: (value: unknown) => void;
}) {
  const [attributesOpen, setAttributesOpen] = useState(false);
  const tokenType =
    typeof listedToken.token.$type === "string" &&
    availableTokenTypes.includes(listedToken.token.$type)
      ? listedToken.token.$type
      : "color";
  const attributes = getTokenAttributeLabels(listedToken.token);
  const hasAttributes = attributes.length > 0;

  return (
    <div className="grid gap-3 px-4 py-3 xl:grid-cols-[minmax(13rem,1.1fr)_9rem_minmax(18rem,1.6fr)_8rem] xl:items-start">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{listedToken.name}</p>
          {hasAttributes ? (
            <span
              className="bg-primary size-2 rounded-full"
              aria-hidden="true"
            />
          ) : null}
        </div>
        <p className="text-muted-foreground truncate text-xs">
          {tokenPathToReferencePath(listedToken.path)}
        </p>
        {listedToken.groupPath.length > 0 ? (
          <Badge variant="outline" className="max-w-full truncate">
            {pathToLabel(listedToken.groupPath)}
          </Badge>
        ) : null}
      </div>

      <Select value={tokenType} onValueChange={onTypeChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {availableTokenTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <TokenValueControl
        type={tokenType}
        value={listedToken.token.$value}
        referenceOptions={referenceOptions}
        onChange={onValueChange}
      />

      <div className="flex items-start gap-2 xl:justify-end">
        <Button
          type="button"
          variant={hasAttributes ? "secondary" : "outline"}
          className={cn(
            "w-full justify-center xl:w-auto",
            hasAttributes && "border-primary/40 text-primary border",
          )}
          onClick={() => setAttributesOpen(true)}
        >
          <Settings2 size={14} />
          <span className="xl:sr-only">Attributes</span>
        </Button>
        <TokenAttributesDialog
          listedToken={listedToken}
          open={attributesOpen}
          onOpenChange={setAttributesOpen}
        />
      </div>
    </div>
  );
}

function TokenAttributesDialog({
  listedToken,
  open,
  onOpenChange,
}: {
  listedToken: ListedToken;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const renameToken = useEditorStore((state) => state.renameToken);
  const deleteToken = useEditorStore((state) => state.deleteToken);
  const updateToken = useEditorStore((state) => state.updateToken);
  const [name, setName] = useState(listedToken.name);
  const [description, setDescription] = useState("");
  const [deprecated, setDeprecated] = useState("");
  const [extensionsText, setExtensionsText] = useState("");
  const [extraText, setExtraText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const renameError = useMemo(() => validateRename(name, true), [name]);

  useEffect(() => {
    setName(listedToken.name);
    setDescription(
      typeof listedToken.token.$description === "string"
        ? listedToken.token.$description
        : "",
    );
    setDeprecated(formatDeprecatedValue(listedToken.token.$deprecated));
    setExtensionsText(
      isRecord(listedToken.token.$extensions)
        ? JSON.stringify(listedToken.token.$extensions, null, 2)
        : "",
    );
    setExtraText(
      JSON.stringify(getExtraAttributes(listedToken.token), null, 2),
    );
    setJsonError(null);
  }, [listedToken, open]);

  const save = () => {
    if (renameError) {
      return;
    }

    let parsedExtensions: Record<string, unknown> | undefined;
    let parsedExtra: Record<string, unknown> = {};

    try {
      parsedExtensions = extensionsText.trim()
        ? (JSON.parse(extensionsText) as unknown as Record<string, unknown>)
        : undefined;
      parsedExtra = extraText.trim()
        ? (JSON.parse(extraText) as unknown as Record<string, unknown>)
        : {};

      if (parsedExtensions !== undefined && !isRecord(parsedExtensions)) {
        setJsonError("$extensions must be a JSON object.");
        return;
      }

      if (!isRecord(parsedExtra)) {
        setJsonError("Additional attributes must be a JSON object.");
        return;
      }
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : "Invalid JSON.");
      return;
    }

    const trimmedName = name.trim();
    const nextPath =
      trimmedName !== listedToken.name
        ? [...listedToken.path.slice(0, -1), trimmedName]
        : listedToken.path;

    if (trimmedName !== listedToken.name) {
      renameToken(listedToken.fileId, listedToken.path, trimmedName);
    }

    updateToken(listedToken.fileId, nextPath, (token) =>
      applyTokenAttributes(token, {
        description,
        deprecated: parseDeprecatedValue(deprecated),
        extensions: parsedExtensions,
        extra: parsedExtra,
      }),
    );
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Token attributes</DialogTitle>
          <DialogDescription>
            Manage non-value attributes for{" "}
            <code>{pathToLabel(listedToken.path)}</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field label="Token name">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            {renameError ? (
              <p className="text-destructive text-xs">{renameError}</p>
            ) : null}
          </Field>

          <div className="flex flex-wrap gap-2">
            {getTokenAttributeLabels(listedToken.token).map((attribute) => (
              <Badge
                key={attribute}
                variant="secondary"
                className="text-primary"
              >
                {attribute}
              </Badge>
            ))}
          </div>

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
          </Field>

          <Field label="Additional attributes">
            <Textarea
              className="min-h-28 font-mono text-xs"
              value={extraText}
              placeholder="{}"
              onChange={(event) => setExtraText(event.target.value)}
            />
          </Field>

          {jsonError ? (
            <p className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
              {jsonError}
            </p>
          ) : null}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              deleteToken(listedToken.fileId, listedToken.path);
              onOpenChange(false);
            }}
          >
            <Trash2 size={14} />
            Delete token
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={Boolean(renameError)}
              onClick={save}
            >
              Save changes
            </Button>
          </div>
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

function getSelectedGroupPath(selection: Selection): string[] {
  if (selection.kind === "token") {
    return selection.path.slice(0, -1);
  }

  return selection.path;
}

function getTokenAttributeLabels(token: TokenObject): string[] {
  const labels: string[] = [];

  if (token.$description !== undefined && token.$description !== "") {
    labels.push("$description");
  }

  if (token.$deprecated !== undefined && token.$deprecated !== "") {
    labels.push("$deprecated");
  }

  if (token.$extensions !== undefined) {
    labels.push("$extensions");
  }

  labels.push(...Object.keys(getExtraAttributes(token)));

  return labels;
}

function getExtraAttributes(token: TokenObject): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(token).filter(([key]) => !knownTokenAttributes.has(key)),
  );
}

function applyTokenAttributes(
  token: TokenObject,
  attributes: {
    description: string;
    deprecated: string | boolean | undefined;
    extensions: Record<string, unknown> | undefined;
    extra: Record<string, unknown>;
  },
): TokenObject {
  const next: TokenObject = {
    $type: token.$type,
    $value: token.$value,
  };

  if (attributes.description !== "") {
    next.$description = attributes.description;
  }

  if (attributes.deprecated !== undefined && attributes.deprecated !== "") {
    next.$deprecated = attributes.deprecated;
  }

  if (attributes.extensions !== undefined) {
    next.$extensions = attributes.extensions;
  }

  Object.entries(attributes.extra)
    .filter(([key]) => !knownTokenAttributes.has(key))
    .forEach(([key, value]) => {
      next[key] = value;
    });

  return next;
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
