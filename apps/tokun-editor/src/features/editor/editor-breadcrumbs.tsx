import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getFile, type Selection, type TokenFile } from "@/lib/token-documents";
import { useEditorStore } from "./editor-store";

export function EditorBreadcrumbs() {
  const files = useEditorStore((state) => state.files);
  const selected = useEditorStore((state) => state.selected);
  const selectFile = useEditorStore((state) => state.selectFile);
  const selectGroup = useEditorStore((state) => state.selectGroup);
  const file = getFile(files, selected.fileId) ?? files[0];

  if (!file) {
    return null;
  }

  const groupPath = getSelectedGroupPath(selected);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink onClick={() => selectFile(file.id)}>
            Workspace
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {groupPath.length === 0 ? (
            <BreadcrumbPage>{shortenFilePath(file)}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink onClick={() => selectGroup(file.id, [])}>
              {shortenFilePath(file)}
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {groupPath.map((segment, index) => {
          const path = groupPath.slice(0, index + 1);
          const isLast = index === groupPath.length - 1;

          return (
            <BreadcrumbSegment
              key={path.join(".")}
              label={segment}
              isLast={isLast}
              onClick={() => selectGroup(file.id, path)}
            />
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function BreadcrumbSegment({
  label,
  isLast,
  onClick,
}: {
  label: string;
  isLast: boolean;
  onClick: () => void;
}) {
  return (
    <>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        {isLast ? (
          <BreadcrumbPage>{label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink onClick={onClick}>{label}</BreadcrumbLink>
        )}
      </BreadcrumbItem>
    </>
  );
}

function getSelectedGroupPath(selection: Selection): string[] {
  if (selection.kind === "token") {
    return selection.path.slice(0, -1);
  }

  return selection.path;
}

function shortenFilePath(file: TokenFile): string {
  return file.path.split("/").at(-1) ?? file.path;
}
