"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { MDXData } from "../utils";

function filterToc(toc: MDXData["toc"], maxDepth?: number) {
  if (!maxDepth) {
    return toc;
  }

  return toc.filter((heading) => heading.level <= maxDepth);
}

export function TocTree({ post }: { post: MDXData }) {
  const activeId = useActiveItem(post.toc.map((heading) => heading.slug));

  return (
    <div className="h-screen-with-nav hidden w-full max-w-[260px] overflow-auto border-l xl:block">
      <div className="px-6 pt-4 text-sm">
        <h3 className="mb-2 rounded-md text-lg font-bold">On this page</h3>
        <ul>
          {filterToc(post.toc, post.metadata.maxTocDepth).map(
            (heading, index) => (
              <li
                key={heading.slug + index}
                className={cn(
                  "mb-1.5 rounded-md text-sm opacity-50",
                  activeId === heading.slug && "opacity-100",
                )}
              >
                <a
                  href={`#${heading.slug}`}
                  style={{ marginLeft: `${(heading.level - 1) * 8}px` }}
                  className={`block break-words`}
                >
                  {heading.title}
                </a>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}

function useActiveItem(itemIds: string[]) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: `0% 0% -80% 0%` },
    );

    itemIds?.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      itemIds?.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [itemIds]);

  return activeId;
}
