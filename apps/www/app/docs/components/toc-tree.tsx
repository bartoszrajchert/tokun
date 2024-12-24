"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { MDXData } from "../utils";

export function TocTree({ post }: { post: MDXData }) {
  const activeId = useActiveItem(post.toc.map((heading) => heading.slug));

  return (
    <div className="hidden text-sm xl:block sticky top-20 -mt-6 h-fit pt-4">
      <h3 className="text-lg font-bold mb-2 rounded-md">On this page</h3>
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
