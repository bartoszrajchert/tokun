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

  return (
    <Breadcrumb className="mt-8 mb-4">
      <BreadcrumbList>
        {pathname.split("/").map((path, index) => {
          if (path === "") {
            return null;
          }
          return (
            <Fragment key={index}>
              <BreadcrumbItem key={index}>{capitalize(path)}</BreadcrumbItem>
              {index !== pathname.split("/").length - 1 && (
                <BreadcrumbSeparator />
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
