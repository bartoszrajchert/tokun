"use client";

import { MDXDataGroupedBySlug } from "@/app/docs/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface DocsSidebarProps {
  config: MDXDataGroupedBySlug[];
}

export function DocsSidebar({ config }: DocsSidebarProps) {
  const pathname = usePathname();

  const generateTree = (data: MDXDataGroupedBySlug[]) => {
    return data
      .sort((a, b) => {
        if (a.metadata.order && b.metadata.order) {
          return Number(a.metadata.order) - Number(b.metadata.order);
        }
        return 0;
      })
      .map((item, index) => {
        return (
          <div key={index} className={cn("pb-2")}>
            {item.content ? (
              <Link
                className={cn(
                  "mb-1 text-sm",
                  pathname === `/docs/${item.slug}` ? "font-bold" : "",
                )}
                href={`/docs/${item.slug}`}
              >
                {item.metadata.title}
              </Link>
            ) : (
              <p className="mb-2 text-sm font-bold">{item.metadata.title}</p>
            )}
            {item.children?.length && (
              <div className="pl-4">{generateTree(item.children)}</div>
            )}
          </div>
        );
      });
  };

  return config.length ? (
    <div className="w-full">{generateTree(config)}</div>
  ) : null;
}
