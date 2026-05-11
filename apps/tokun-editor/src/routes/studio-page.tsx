import { ModeToggle } from "@/components/mode-toggle";
import { EditorBreadcrumbs } from "@/features/editor/editor-breadcrumbs";
import { TokenListPanel } from "@/features/editor/token-list-panel";
import { TransformPanel } from "@/features/editor/transform-panel";
import { WorkspaceSidebar } from "@/features/editor/workspace-sidebar";

export function StudioPage() {
  return (
    <main className="min-h-dvh lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <WorkspaceSidebar />
      <div className="flex min-w-0 flex-col">
        <header className="bg-background/85 supports-[backdrop-filter]:bg-background/70 sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4 backdrop-blur">
          <EditorBreadcrumbs />
          <div className="ml-auto hidden lg:block">
            <ModeToggle />
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6">
          <div className="mx-auto grid max-w-[1500px] gap-4 2xl:grid-cols-[minmax(0,1fr)_440px]">
            <TokenListPanel />
            <TransformPanel />
          </div>
        </div>
      </div>
    </main>
  );
}
