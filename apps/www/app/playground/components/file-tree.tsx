import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  FileJson,
  Folder,
  FolderOpen,
} from "lucide-react";
import type { TreeNode } from "./showcase-form.types";

type FileTreeProps = {
  nodes: TreeNode[];
  expandedDirectories: Set<string>;
  activeFileId: string;
  errorFileId?: string;
  onToggleDirectory: (path: string) => void;
  onSelectFile: (fileId: string) => void;
  depth?: number;
};

export function FileTree({
  nodes,
  expandedDirectories,
  activeFileId,
  errorFileId,
  onToggleDirectory,
  onSelectFile,
  depth = 0,
}: FileTreeProps) {
  return nodes.map((node) => {
    const leftPadding = 8 + depth * 14;

    if (node.type === "directory") {
      const isExpanded = expandedDirectories.has(node.path);

      return (
        <div key={`dir-${node.path}`}>
          <button
            type="button"
            className="hover:bg-accent/60 text-foreground/75 flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-sm"
            onClick={() => onToggleDirectory(node.path)}
            style={{ paddingLeft: leftPadding }}
          >
            {isExpanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
            {isExpanded ? <FolderOpen size={14} /> : <Folder size={14} />}
            <span className="truncate">{node.name}</span>
          </button>

          {isExpanded ? (
            <FileTree
              nodes={node.children}
              expandedDirectories={expandedDirectories}
              activeFileId={activeFileId}
              errorFileId={errorFileId}
              onToggleDirectory={onToggleDirectory}
              onSelectFile={onSelectFile}
              depth={depth + 1}
            />
          ) : null}
        </div>
      );
    }

    const isActive = node.fileId === activeFileId;
    const hasError = node.fileId === errorFileId;

    return (
      <button
        key={`file-${node.fileId}`}
        type="button"
        className={cn(
          "flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-left text-sm transition-colors",
          isActive
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/60 text-foreground/80",
          hasError ? "text-destructive" : "",
        )}
        onClick={() => onSelectFile(node.fileId)}
        style={{ paddingLeft: leftPadding }}
      >
        <FileJson size={14} />
        <span className="truncate">{node.name}</span>
      </button>
    );
  });
}
