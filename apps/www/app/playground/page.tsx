import { readFileSync } from "fs";
import path from "path";
import ShowcaseForm from "./components/showcase-form";

export const metadata = {
  title: "Playground",
};

export default function Page() {
  const example = readFileSync(
    path.resolve("../../examples/templates/basic/basic.tokens.json"),
    "utf-8",
  );

  return (
    <div className="prose dark:prose-invert my-6 max-w-none">
      <h1>Playground</h1>
      <p className="pb-6">
        Play with Tokun here. Enter your JSON object set the format and loader
        and see the tokens generated.
      </p>
      <ShowcaseForm example={example} />
    </div>
  );
}
