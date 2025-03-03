import { DocsSidebar } from "@/app/docs/components/docs-sidebar";

import { JSX } from "react";
import { getDocs, groupBySlug } from "./utils";

export default async function Layout({
  children,
}: {
  children: JSX.Element | JSX.Element[];
}) {
  const docs = await getDocs();

  return (
    <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <aside className="border-border/40 dark:border-border fixed top-14 z-30 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 border-r md:sticky md:block">
        <div className="no-scrollbar h-full overflow-auto py-6 pr-6 lg:py-8">
          <DocsSidebar config={groupBySlug(docs)} />
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
