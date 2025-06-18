import { Code } from "@/components/code";
import { Button } from "@/components/ui/button";
import { Metadata } from "next";
import Link from "next/link";
import { readFileSync } from "node:fs";
import path from "node:path";

export const metadata: Metadata = {
  title: "Tokun",
  description: "Build themes. Easy.",
};

export default function Home() {
  const filePath = path.resolve("../../examples/templates/basic/config.mjs");
  const content = readFileSync(filePath, "utf-8");

  return (
    <div className="flex items-center justify-center py-8 sm:h-[calc(100vh-80px)]">
      <div className="my-auto flex w-full flex-col-reverse items-center justify-center gap-8 lg:w-[1000px] lg:flex-row">
        <figure className="bg-accent border-border w-full overflow-auto rounded-xl border px-6 pb-3 shadow-lg">
          <figcaption className="text-foreground/60 py-3 text-center text-sm">
            {filePath.split("/").slice(-1)[0]}
          </figcaption>
          <pre className="w-fit">
            <Code>{content}</Code>
          </pre>
        </figure>
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl">Build themes. Easy.</h1>
            <p className="text-foreground/60">
              The simple, and easy-to-use tool for working with design tokens
              with powerups.
            </p>
          </div>
          <div>
            <p className="text-foreground/60">
              {">"} npm i -D <span className="text-foreground">tokun</span>
            </p>
          </div>
          <div className="space-x-2">
            <Link href="/docs/getting-started/introduction">
              <Button>Get started</Button>
            </Link>
            <Link href="/playground">
              <Button variant="outline">See how it works</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
