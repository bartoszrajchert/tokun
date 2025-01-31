"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { MDXDataGroupedBySlug } from "@/app/docs/utils";
import { cn } from "@/lib/utils";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { ExternalLinkIcon, MenuIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Drawer, DrawerContent, DrawerTitle, DrawerTrigger } from "./ui/drawer";
import { ModeToggle } from "./ui/mode-toggle";
import { Tooltip, TooltipContent } from "./ui/tooltip";

export interface MainNavProps {
  config: MDXDataGroupedBySlug[];
}

export function MainNav({ config }: MainNavProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <Drawer open={isDrawerOpen} onOpenChange={setDrawerOpen}>
      <header
        className={cn(
          "border-border/40 bg-background/95 supports-[backdrop-filter]:bg-background/60 dark:border-border fixed left-2 right-2 top-2 z-50 mx-auto max-w-[1200px] rounded-full border px-8 backdrop-blur-xl sm:top-3",
        )}
      >
        <div className="m-auto flex h-14 items-center justify-between">
          <div className="mr-4 flex">
            <Link
              href="/"
              className="mr-6 flex items-center space-x-2 text-[24px] lg:mr-8"
            >
              <span className="font-black italic">TOKUN</span>
            </Link>
            <nav className="hidden items-center gap-4 text-sm sm:flex xl:gap-6">
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
            </nav>
          </div>
          <div className="hidden items-center gap-8 sm:flex">
            <div className="flex gap-4">
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <a
                    href="#"
                    className="flex items-center gap-1 text-sm opacity-40 hover:underline"
                  >
                    Figma <ExternalLinkIcon size={14} />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Comming soon</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href="#"
                    className="flex items-center gap-1 text-sm opacity-40 hover:underline"
                  >
                    Preview app <ExternalLinkIcon size={14} />
                  </a>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">Comming soon</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <ModeToggle />
          </div>
          <div className="block sm:hidden">
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <MenuIcon />
              </Button>
            </DrawerTrigger>
          </div>
        </div>
        <MobileDrawerContent config={config} />
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
        <nav className={cn("flex flex-col gap-4 py-4 text-sm", "sm:hidden")}>
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
