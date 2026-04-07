import { PackageManagerTabs } from "@/components/package-manager-tabs";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "node:fs";
import path from "node:path";

export const metadata: Metadata = {
  title: "Tokun",
  description: "Same token output via CLI or config flow.",
};

export default function Home() {
  const filePath = path.resolve("../../examples/templates/simple/config.mjs");
  const content = readFileSync(filePath, "utf-8");

  return (
    <main className="flex min-h-[calc(100dvh-80px)] items-center justify-center py-2 sm:py-4">
      <section className="w-full max-w-[1160px] px-3 py-3 sm:px-4 sm:py-4">
        <header className="grid gap-1.5">
          <p className="text-foreground/60 text-[11px] uppercase tracking-[0.13em]">
            Tokun
          </p>
          <h1 className="text-[1.65rem] leading-none tracking-tight sm:text-[2.3rem]">
            Build and validate design tokens. Easy.
          </h1>
          <p className="text-foreground/75 max-w-3xl text-sm leading-relaxed sm:text-base">
            The simple, and easy-to-use tool for working with design tokens with
            powerups. It can support you building themes and using it in
            multiple platforms.
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <Link href="/playground">
              <Button size="sm">Try it in playground</Button>
            </Link>
            <Link href="/docs/getting-started/introduction">
              <Button size="sm" variant="outline">
                Documentation
              </Button>
            </Link>
          </div>
        </header>

        <section className="mt-8 grid gap-3 lg:grid-cols-2">
          <article className="bg-background flex min-h-0 flex-col gap-2 rounded-xl border p-3">
            <p className="text-foreground/60 text-[11px] uppercase tracking-[0.12em]">
              1) CLI use
            </p>
            <h2 className="text-sm font-medium tracking-tight sm:text-[0.95rem]">
              Run with npm, yarn, pnpm, or bun
            </h2>
            <PackageManagerTabs
              className="bg-card/70 my-0 rounded-md [&_pre]:max-h-24 [&_pre]:overflow-auto"
              npm="npx tokun build -c config.mjs"
              yarn="yarn dlx tokun build -c config.mjs"
              pnpm="pnpm dlx tokun build -c config.mjs"
              bun="bunx tokun build -c config.mjs"
            />
            <p className="text-foreground/70 text-xs leading-relaxed">
              Basic build options:
              <code className="bg-muted mx-1 rounded border px-1 py-0.5 text-[0.9em]">
                --config, --input, --output, --loader, --format, --silent,
                --verbose, --no-warn
              </code>
            </p>
            <Link href="/docs/getting-started/using-the-cli">
              <p className="text-foreground/70 text-xs leading-relaxed">
                For more details, read Using the CLI .
              </p>
            </Link>
          </article>

          <article className="bg-background flex min-h-0 flex-col gap-2 rounded-xl border p-3">
            <p className="text-foreground/60 text-[11px] uppercase tracking-[0.12em]">
              2) Config use
            </p>
            <h2 className="text-sm font-medium tracking-tight sm:text-[0.95rem]">
              Simple config file, which can be easily extended with custom
              loaders, transforms, formats, validators, etc.
            </h2>
            <div className="bg-muted/35 text-foreground/75 grid gap-1 rounded-md border border-dashed p-2 text-xs leading-relaxed">
              <pre className="w-fit">
                <code>{content}</code>
              </pre>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
