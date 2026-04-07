import { readFileSync } from "fs";
import type { Metadata } from "next";
import path from "path";
import ShowcaseForm from "./components/showcase-form";

export const metadata: Metadata = {
  title: "Playground | Tokun",
  description:
    "Play with Tokun here. Enter one or more token JSON files, choose loader and format, and inspect generated output.",
};

export default function Page() {
  const presets = [
    {
      id: "simple",
      label: "Simple",
      description: "Single token file for quick experiments.",
      files: [
        {
          name: "simple.tokens.json",
          content: readFileSync(
            path.resolve("../../examples/templates/simple/simple.tokens.json"),
            "utf-8",
          ),
        },
      ],
    },
    {
      id: "advanced",
      label: "Advanced",
      description: "Multiple files with aliases and nested token groups.",
      files: [
        {
          name: "base.tokens.json",
          content: readFileSync(
            path.resolve(
              "../../examples/templates/advanced/tokens/base.tokens.json",
            ),
            "utf-8",
          ),
        },
        {
          name: "theme/color.tokens.json",
          content: readFileSync(
            path.resolve(
              "../../examples/templates/advanced/tokens/theme/color.tokens.json",
            ),
            "utf-8",
          ),
        },
        {
          name: "theme/custom.tokens.json",
          content: readFileSync(
            path.resolve(
              "../../examples/templates/advanced/tokens/theme/custom.tokens.json",
            ),
            "utf-8",
          ),
        },
        {
          name: "theme/more.tokens.json",
          content: readFileSync(
            path.resolve(
              "../../examples/templates/advanced/tokens/theme/more.tokens.json",
            ),
            "utf-8",
          ),
        },
        {
          name: "theme/typography.tokens.json",
          content: readFileSync(
            path.resolve(
              "../../examples/templates/advanced/tokens/theme/typography.tokens.json",
            ),
            "utf-8",
          ),
        },
      ],
    },
  ];

  return (
    <div className="mx-auto my-6 max-w-[1400px] space-y-4 pb-8">
      <h1 className="text-3xl sm:text-4xl">Playground</h1>
      <p className="text-foreground/70 max-w-3xl text-sm sm:text-base">
        Build and validate design tokens in one place. Start from a preset,
        tweak the JSON, choose a loader and format, then run the builder to
        inspect generated output.
      </p>
      <ShowcaseForm presets={presets} />
    </div>
  );
}
