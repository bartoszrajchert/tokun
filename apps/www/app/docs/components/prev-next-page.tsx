"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { sidebarConfig } from "../sidebar";
import { MDXData } from "../utils";

export default function PrevNextPage({ data }: { data: MDXData[] }) {
  const pathname = usePathname();

  const currPathname = pathname.split("/").slice(2).join("/");
  const sortedData = data.sort((a, b) => {
    const aIndex = sidebarConfig.info.findIndex(
      (item) => item.slug === a.slug[0],
    );
    const bIndex = sidebarConfig.info.findIndex(
      (item) => item.slug === b.slug[0],
    );

    if (aIndex !== bIndex) {
      return aIndex - bIndex;
    }

    return Number(a.metadata.order) - Number(b.metadata.order);
  });

  const currentIndex = Math.max(
    0,
    sortedData.findIndex((item) => item.slug.join("/") === currPathname),
  );

  const prev = sortedData[currentIndex - 1];
  const next = sortedData[currentIndex + 1];

  return (
    <div className="my-12 flex w-full flex-col justify-between gap-2 sm:flex-row">
      {prev ? (
        <Link href={`/docs/${prev.slug.join("/")}`}>
          <Button
            variant="outline"
            size="lg"
            className="h-fit w-full min-w-[120px] justify-start px-4 py-3 text-right"
          >
            <div className="space-y-1">
              <p className="text-foreground/60">Next</p>
              <div className="flex items-center gap-1">
                <ChevronLeftIcon />
                <p>{prev.metadata.title}</p>
              </div>
            </div>
          </Button>
        </Link>
      ) : (
        <div></div>
      )}
      {next ? (
        <Link href={`/docs/${next.slug.join("/")}`}>
          <Button
            variant="outline"
            size="lg"
            className="h-fit w-full min-w-[120px] justify-end px-4 py-3 text-left"
          >
            <div className="space-y-1">
              <p className="text-foreground/60">Previous</p>
              <div className="flex items-center gap-1">
                <p>{next.metadata.title}</p>
                <ChevronRightIcon />
              </div>
            </div>
          </Button>
        </Link>
      ) : (
        <div></div>
      )}
    </div>
  );
}
