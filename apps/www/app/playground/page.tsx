import ShowcaseForm from "./components/showcase-form";

export const metadata = {
  title: "Playground",
};

export default function Page() {
  return (
    <div className="prose dark:prose-invert max-w-none my-6">
      <h1>Playground</h1>
      <p className="pb-6">
        Play with tokun here. Enter your JSON object set the format and loader
        and see the tokens generated.
      </p>
      <ShowcaseForm />
    </div>
  );
}
