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
    <div className="-mx-8 flex">
      <DocsSidebar config={groupBySlug(docs)} />
      <div className="min-w-0 flex-grow">{children}</div>
    </div>
  );
}
