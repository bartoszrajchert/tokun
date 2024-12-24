"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { ModeToggle } from "./ui/mode-toggle";

export function MainNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border">
      <div className="flex h-14 items-center justify-between max-w-[1200px] m-auto">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-4 flex items-center space-x-2 lg:mr-6">
            <span className="hidden font-bold lg:inline-block">🥷 tokun</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm xl:gap-6">
            <Link
              href="/playground"
              className={cn(
                "transition-colors hover:text-foreground/80",
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
                "transition-colors hover:text-foreground/80",
                pathname?.startsWith("/docs")
                  ? "text-foreground"
                  : "text-foreground/60",
              )}
            >
              Docs
            </Link>
          </nav>
        </div>
        <ModeToggle />
      </div>
    </header>
  );
}
