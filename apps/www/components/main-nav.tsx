"use client";

import { MDXDataGroupedBySlug } from "@/app/docs/utils";
import { cn } from "@/lib/utils";
import { MenuIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import SearchDialog from "./search-dialog";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { ModeToggle } from "./ui/mode-toggle";

export interface MainNavProps {
  config: MDXDataGroupedBySlug[];
}

export function MainNav({ config }: MainNavProps) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <header className="border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 dark:border-border sticky top-0 z-50 w-full border-b backdrop-blur">
        <nav className="m-auto flex h-14 items-center justify-between px-8">
          <div className="mr-4 flex">
            <Link
              href="/"
              className="flex items-center space-x-2 sm:mr-4 lg:mr-6"
            >
              <span className="inline-block font-bold">🥷 Tokun</span>
            </Link>
            <div className="hidden items-center gap-4 text-sm md:flex xl:gap-6">
              <Link
                href="/playground"
                className={cn(
                  "hover:text-foreground/80 transition-colors",
                  pathname?.startsWith("/playground")
                    ? "text-foreground"
                    : "text-foreground/60",
                )}
              >
                Playground
              </Link>
              <Link
                href="/docs"
                className={cn(
                  "hover:text-foreground/80 transition-colors",
                  pathname?.startsWith("/docs")
                    ? "text-foreground"
                    : "text-foreground/60",
                )}
              >
                Docs
              </Link>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="space-x-2">
              <a
                href="https://github.com/bartoszrajchert/tokun"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="ghost" className="hidden md:inline-flex">
                  <StarIcon /> Star Tokun on GitHub
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="fill-white md:hidden"
                >
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <title>GitHub</title>
                    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                  </svg>
                </Button>
              </a>
              <SearchDialog />
              <div className="hidden md:inline-block">
                <ModeToggle />
              </div>
            </div>
            <div className="block md:hidden">
              <DrawerTrigger asChild>
                <Button variant="outline" size="icon">
                  <MenuIcon />
                </Button>
              </DrawerTrigger>
            </div>
          </div>
          <MobileDrawerContent config={config} />
        </nav>
      </header>
    </Drawer>
  );
}

export interface MobileDrawerContentProps {
  config: MDXDataGroupedBySlug[];
}

export function MobileDrawerContent({ config }: MobileDrawerContentProps) {
  const pathname = usePathname();
  const generateDocsTree = (data: MDXDataGroupedBySlug[]) => {
    return data
      .sort((a, b) => {
        if (a.metadata.order && b.metadata.order) {
          return Number(a.metadata.order) - Number(b.metadata.order);
        }
        return 0;
      })
      .map((item, index) => {
        return (
          <div key={index} className={cn("pb-3")}>
            {item.content ? (
              <Link
                className={cn(
                  "mb-2 text-[16px]",
                  pathname === `/docs/${item.slug}`
                    ? "text-foreground"
                    : "text-foreground/60",
                )}
                href={`/docs/${item.slug}`}
              >
                {item.metadata.title}
              </Link>
            ) : (
              <Link
                className={cn(
                  "text-[16px]",
                  pathname?.startsWith("/docs")
                    ? "text-foreground"
                    : "text-foreground/60",
                )}
                href={`/docs/${item.children![0].slug}`}
              >
                {item.metadata.title}
              </Link>
            )}
            {item.children?.length && (
              <div className="pl-2 pt-4">{generateDocsTree(item.children)}</div>
            )}
          </div>
        );
      });
  };

  return (
    <DrawerContent>
      <div className="px-4 py-6">
        <DrawerTitle>Navigation</DrawerTitle>
        <nav className={cn("flex flex-col gap-4 py-4 text-sm", "md:hidden")}>
          <Link
            href="/playground"
            className={cn(
              "hover:text-foreground/80 text-[16px] transition-colors",
              pathname?.startsWith("/playground")
                ? "text-foreground"
                : "text-foreground/60",
            )}
          >
            Playground
          </Link>
          <Link
            href="/docs"
            className={cn(
              "hover:text-foreground/80 text-[16px] transition-colors",
              pathname?.startsWith("/docs")
                ? "text-foreground"
                : "text-foreground/60",
            )}
          >
            Docs
          </Link>
          <div className="pl-2">{generateDocsTree(config)}</div>
        </nav>
      </div>
    </DrawerContent>
  );
}
