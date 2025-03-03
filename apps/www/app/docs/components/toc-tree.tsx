"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { MDXData } from "../utils";

// TODO: make it scrollable
export function TocTree({ post }: { post: MDXData }) {
  const activeId = useActiveItem(post.toc.map((heading) => heading.slug));

  return (
    <div className="sticky top-16 -mt-6 hidden h-screen overflow-visible pt-4 text-sm xl:block">
      <h3 className="mb-2 rounded-md text-lg font-bold">On this page</h3>
      <ul>
        {post.toc.map((heading) => (
          <li
            key={heading.slug}
            className={cn(
              "mb-1.5 rounded-md text-sm opacity-50",
              activeId === heading.slug && "opacity-100",
            )}
          >
            <a
              href={`#${heading.slug}`}
              style={{ marginLeft: `${(heading.level - 1) * 8}px` }}
              className={`block`}
            >
              {heading.title}
            </a>
          </li>
        ))}
      </ul>
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
