"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { capitalize } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

export default function BreadcrumbPathname() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <Breadcrumb className="mb-4 mt-8">
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const key = segments.slice(0, index + 1).join("/");

          return (
            <Fragment key={key}>
              <BreadcrumbItem>{capitalize(segment)}</BreadcrumbItem>
              {index < segments.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
