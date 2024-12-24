"use client";

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
        <a href={`/docs/${prev.slug.join("/")}`} className="text-blue-500">
          ← {prev.metadata.title}
        </a>
      ) : (
        <div></div>
      )}
      {next ? (
        <a href={`/docs/${next.slug.join("/")}`} className="text-blue-500">
          {next.metadata.title} →
        </a>
      ) : (
        <div></div>
      )}
    </div>
  );
}
