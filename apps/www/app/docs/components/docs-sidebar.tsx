"use client";

import { MDXDataGroupedBySlug } from "@/app/docs/utils";
import { Button } from "@/components/ui/button";
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
          <div key={index}>
            {item.content ? (
              <Link href={`/docs/${item.slug}`}>
                <Button
                  variant="ghost"
                  className={cn(
                    "mb-0.5 h-auto w-full justify-start text-wrap p-2 text-left font-normal",
                    pathname === `/docs/${item.slug}` ? "bg-accent" : "",
                  )}
                  size="sm"
                >
                  {item.metadata.title}
                </Button>
              </Link>
            ) : (
              <p className="mb-2 text-sm font-bold">{item.metadata.title}</p>
            )}
            {item.children?.length && (
              <div className="mb-3">{generateTree(item.children)}</div>
            )}
          </div>
        );
      });
  };

  return config.length ? (
    <div className="h-screen-with-nav hidden max-w-[280px] overflow-auto border-r py-6 pl-8 pr-8 md:block lg:py-8">
      <nav className="w-full">{generateTree(config)}</nav>
    </div>
  ) : null;
}
