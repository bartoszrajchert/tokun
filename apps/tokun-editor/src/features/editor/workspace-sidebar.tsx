import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  buildSidebarTree,
  getFile,
  pathToLabel,
  type CustomTokenType,
  type Selection,
  type SidebarTreeNode,
  type TokenFile,
} from "@/lib/token-documents";
import { cn } from "@/lib/utils";
import { exportWorkspace, readWorkspaceFile } from "@/lib/workspace-files";
import {
  ChevronRight,
  FileJson2,
  Folder,
  FolderOpen,
  Folders,
  Layers3,
  MoreHorizontal,
  Plus,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { useEditorStore } from "./editor-store";
import { GroupAttributesDialog } from "./group-attributes-dialog";

export function WorkspaceSidebar() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const files = useEditorStore((state) => state.files);
  const customTypes = useEditorStore((state) => state.customTypes);
  const selected = useEditorStore((state) => state.selected);
  const selectFile = useEditorStore((state) => state.selectFile);
  const selectGroup = useEditorStore((state) => state.selectGroup);
  const createFile = useEditorStore((state) => state.createFile);
  const createGroup = useEditorStore((state) => state.createGroup);
  const renameFile = useEditorStore((state) => state.renameFile);
  const deleteGroup = useEditorStore((state) => state.deleteGroup);
  const replaceFiles = useEditorStore((state) => state.replaceFiles);
  const activeFile = getFile(files, selected.fileId) ?? files[0];
  const sidebarTree = buildSidebarTree(files);
  const selectedGroupPath = getSelectedGroupPath(selected);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(
    () => new Set(),
  );

  const toggleNode = (nodeId: string) => {
    setCollapsedNodeIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  return (
    <aside className="bg-sidebar text-sidebar-foreground flex min-h-dvh flex-col border-r lg:sticky lg:top-0 lg:h-dvh">
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-lg">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Tokun Editor</p>
          <p className="text-sidebar-foreground/65 truncate text-xs">
            Token workspace
          </p>
        </div>
        <div className="ml-auto lg:hidden">
          <ModeToggle />
        </div>
      </div>

      <div className="border-b p-3">
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={createFile}
          >
            <Plus size={14} />
            File
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              activeFile && createGroup(activeFile.id, selectedGroupPath)
            }
            disabled={!activeFile}
          >
            <Plus size={14} />
            Group
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => activeFile && createParentFolderForFile(activeFile, renameFile)}
            disabled={!activeFile}
          >
            <Plus size={14} />
            Folder
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        <div className="text-sidebar-foreground/55 px-2 py-2 text-xs font-medium uppercase tracking-wide">
          Files and groups
        </div>
        {sidebarTree.length > 0 ? (
          <div>
            {sidebarTree.map((node) => (
              <SidebarTreeNodeView
                key={node.id}
                node={node}
                selected={selected}
                depth={0}
                collapsedNodeIds={collapsedNodeIds}
                onToggleNode={toggleNode}
                onSelectFile={selectFile}
                onSelectGroup={selectGroup}
                onRenameFile={renameFile}
                onCreateParentFolder={renameFile}
                onCreateGroup={createGroup}
                onDeleteGroup={deleteGroup}
              />
            ))}
          </div>
        ) : (
          <p className="text-sidebar-foreground/65 px-2 py-3 text-sm">
            Create a file to start adding groups.
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-2 p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => exportWorkspace(files, customTypes)}
          >
            <RotateCcw size={14} />
            Export
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={14} />
            Import
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void importWorkspace(file, replaceFiles);
            }
            event.currentTarget.value = "";
          }}
        />
      </div>
    </aside>
  );
}

function SidebarTreeNodeView({
  node,
  selected,
  depth,
  collapsedNodeIds,
  onToggleNode,
  onSelectFile,
  onSelectGroup,
  onRenameFile,
  onCreateParentFolder,
  onCreateGroup,
  onDeleteGroup,
}: {
  node: SidebarTreeNode;
  selected: Selection;
  depth: number;
  collapsedNodeIds: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onSelectFile: (fileId: string) => void;
  onSelectGroup: (fileId: string, path: string[]) => void;
  onRenameFile: (fileId: string, nextPath: string) => void;
  onCreateParentFolder: (fileId: string, nextPath: string) => void;
  onCreateGroup: (fileId: string, parentPath: string[]) => void;
  onDeleteGroup: (fileId: string, path: string[]) => void;
}) {
  const [attributesOpen, setAttributesOpen] = useState(false);
  if (node.kind === "token") {
    return null;
  }

  const isSelected =
    node.kind === "file"
      ? selected.kind === "file" && selected.fileId === node.fileId
      : node.kind === "group"
        ? selected.fileId === node.fileId &&
          getSelectedGroupPath(selected).join(".") === node.path.join(".")
        : false;
  const Icon = getNodeIcon(node, isSelected);
  const childNodes = node.children.filter((child) => child.kind !== "token");
  const isExpanded = !collapsedNodeIds.has(node.id);
  const isFileFolder = node.kind === "directory";
  const isTokenGroup = node.kind === "group";

  return (
    <div>
      <div
        className={cn(
          "group/sidebar-row flex items-center gap-1 rounded-md text-sm",
          isSelected && "bg-sidebar-accent text-sidebar-accent-foreground",
          isFileFolder && "text-sidebar-foreground/75",
          isTokenGroup && "text-sidebar-foreground",
        )}
        style={{ paddingLeft: `${depth * 0.85}rem` }}
      >
        <button
          type="button"
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex size-7 shrink-0 items-center justify-center rounded-md transition-colors"
          onClick={() => childNodes.length > 0 && onToggleNode(node.id)}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.name}`}
          disabled={childNodes.length === 0}
        >
          <ChevronRight
            size={14}
            className={cn(
              "text-sidebar-foreground/45 shrink-0 transition-transform",
              isExpanded && "rotate-90",
              childNodes.length === 0 && "opacity-0",
            )}
          />
        </button>
        <button
          type="button"
          className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors"
          onClick={() => {
            if (node.kind === "directory") {
              if (childNodes.length > 0) {
                onToggleNode(node.id);
              }
              return;
            }

            if (node.kind === "file") {
              onSelectFile(node.fileId);
              return;
            }

            if (node.kind === "group") {
              onSelectGroup(node.fileId, node.path);
            }
          }}
        >
          <Icon size={15} className="shrink-0" />
          <span className="min-w-0 truncate">
            {node.name}
            {isTokenGroup ? (
              <span className="text-sidebar-foreground/45 ml-1 text-[0.68rem] font-medium uppercase tracking-wide">
                group
              </span>
            ) : null}
          </span>
        </button>

        {node.kind === "directory" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="mr-1 size-7 opacity-0 transition-opacity group-hover/sidebar-row:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Open ${node.name} actions`}
              >
                <MoreHorizontal size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => createParentFolderForDirectory(node, onCreateParentFolder)}
              >
                Add parent folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {node.kind === "file" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="mr-1 size-7 opacity-0 transition-opacity group-hover/sidebar-row:opacity-100 data-[state=open]:opacity-100"
                aria-label={`Open ${node.name} actions`}
              >
                <MoreHorizontal size={15} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => renameFileFromPrompt(node, onRenameFile)}>
                Rename file
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => createParentFolderForFileNode(node, onCreateParentFolder)}
              >
                Add parent folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onCreateGroup(node.fileId, [])}>
                Add root group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {node.kind === "group" ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="mr-1 size-7 opacity-0 transition-opacity group-hover/sidebar-row:opacity-100 data-[state=open]:opacity-100"
                  aria-label={`Open ${pathToLabel(node.path)} actions`}
                >
                  <MoreHorizontal size={15} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setAttributesOpen(true)}>
                  Edit attributes
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onCreateGroup(node.fileId, node.path)}
                >
                  Add child group
                </DropdownMenuItem>
                {node.path.length > 0 ? (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteGroup(node.fileId, node.path)}
                    >
                      Delete group
                    </DropdownMenuItem>
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <GroupAttributesDialog
              fileId={node.fileId}
              path={node.path}
              open={attributesOpen}
              onOpenChange={setAttributesOpen}
            />
          </>
        ) : null}
      </div>

      {isExpanded
        ? childNodes.map((child) => (
            <SidebarTreeNodeView
              key={child.id}
              node={child}
              selected={selected}
              depth={depth + 1}
              collapsedNodeIds={collapsedNodeIds}
              onToggleNode={onToggleNode}
              onSelectFile={onSelectFile}
              onSelectGroup={onSelectGroup}
              onRenameFile={onRenameFile}
              onCreateParentFolder={onCreateParentFolder}
              onCreateGroup={onCreateGroup}
              onDeleteGroup={onDeleteGroup}
            />
          ))
        : null}
    </div>
  );
}

function getNodeIcon(
  node: Exclude<SidebarTreeNode, { kind: "token" }>,
  isSelected: boolean,
) {
  if (node.kind === "directory") {
    return isSelected ? FolderOpen : Folder;
  }

  if (node.kind === "file") {
    return FileJson2;
  }

  return isSelected ? Folders : Layers3;
}

function renameFileFromPrompt(
  node: Extract<SidebarTreeNode, { kind: "file" }>,
  renameFile: (fileId: string, nextPath: string) => void,
) {
  const fileName = getPathName(node.path);
  const nextName = window.prompt("File name", fileName)?.trim();

  if (!nextName) {
    return;
  }

  renameFile(node.fileId, joinPath(getParentPath(node.path), nextName));
}

function createParentFolderForFile(
  file: TokenFile,
  renameFile: (fileId: string, nextPath: string) => void,
) {
  const folderName = promptForFolderName();

  if (!folderName) {
    return;
  }

  renameFile(file.id, insertParentFolder(file.path, folderName));
}

function createParentFolderForFileNode(
  node: Extract<SidebarTreeNode, { kind: "file" }>,
  renameFile: (fileId: string, nextPath: string) => void,
) {
  const folderName = promptForFolderName();

  if (!folderName) {
    return;
  }

  renameFile(node.fileId, insertParentFolder(node.path, folderName));
}

function createParentFolderForDirectory(
  node: Extract<SidebarTreeNode, { kind: "directory" }>,
  renameFile: (fileId: string, nextPath: string) => void,
) {
  const folderName = promptForFolderName();

  if (!folderName) {
    return;
  }

  const parentPath = getParentPath(node.path);
  const directoryName = getPathName(node.path);

  for (const file of collectFileNodes(node.children)) {
    const suffix = file.path.slice(node.path.length).replace(/^\/+/, "");
    renameFile(
      file.fileId,
      joinPath(parentPath, folderName, directoryName, suffix),
    );
  }
}

function collectFileNodes(nodes: SidebarTreeNode[]): Extract<SidebarTreeNode, { kind: "file" }>[] {
  return nodes.flatMap((node): Extract<SidebarTreeNode, { kind: "file" }>[] => {
    if (node.kind === "file") {
      return [node];
    }

    if (node.kind === "directory") {
      return collectFileNodes(node.children);
    }

    return [];
  });
}

function promptForFolderName(): string | null {
  const folderName = window.prompt("Folder name")?.trim().replaceAll("\\", "/");

  if (!folderName) {
    return null;
  }

  return folderName.replace(/^\/+|\/+$/g, "");
}

function insertParentFolder(path: string, folderName: string): string {
  return joinPath(getParentPath(path), folderName, getPathName(path));
}

function getParentPath(path: string): string {
  const normalizedPath = path.replaceAll("\\", "/");
  const lastSlashIndex = normalizedPath.lastIndexOf("/");

  return lastSlashIndex === -1 ? "" : normalizedPath.slice(0, lastSlashIndex);
}

function getPathName(path: string): string {
  const normalizedPath = path.replaceAll("\\", "/");
  return normalizedPath.split("/").filter(Boolean).at(-1) ?? normalizedPath;
}

function joinPath(...parts: string[]): string {
  return parts
    .flatMap((part) => part.replaceAll("\\", "/").split("/"))
    .filter(Boolean)
    .join("/");
}

function getSelectedGroupPath(selection: Selection): string[] {
  if (selection.kind === "token") {
    return selection.path.slice(0, -1);
  }

  return selection.path;
}

async function importWorkspace(
  file: File,
  replaceFiles: (
    files: TokenFile[],
    selectedPresetId?: string,
    customTypes?: CustomTokenType[],
  ) => void,
) {
  const workspace = await readWorkspaceFile(file);
  replaceFiles(workspace.files, "custom", workspace.customTypes);
}
