import { DocsSidebar } from "@/app/docs/components/docs-sidebar";

import type { ReactNode } from "react";
import { getDocs, groupBySlug } from "./utils";

export default async function Layout({ children }: { children: ReactNode }) {
  const docs = await getDocs();

  return (
    <div className="-mx-8 flex">
      <DocsSidebar config={groupBySlug(docs)} />
      <div className="min-w-0 grow">{children}</div>
    </div>
  );
}
