"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MDXData } from "../utils";

export default function PrevNextPage({ data }: { data: MDXData[] }) {
  const pathname = usePathname();

  const currPathname = pathname.split("/").slice(2).join("/");
  const sortedData = data.sort((a, b) => {
    return Number(a.metadata.order) - Number(b.metadata.order);
  });

  const currentIndex = Math.max(
    0,
    sortedData.findIndex((item) => item.slug.join("/") === currPathname),
  );

  const prev = sortedData[currentIndex - 1];
  const next = sortedData[currentIndex + 1];

  return (
    <div className="flex justify-between my-12">
      {prev ? (
        <Link href={`/docs/${prev.slug.join("/")}`}>
          <Button variant="ghost">
            <ChevronLeftIcon /> {prev.metadata.title}
          </Button>
        </Link>
      ) : (
        <div></div>
      )}
      {next ? (
        <Link href={`/docs/${next.slug.join("/")}`}>
          <Button variant="ghost">
            {next.metadata.title} <ChevronRightIcon />
          </Button>
        </Link>
      ) : (
        <div></div>
      )}
    </div>
  );
}
