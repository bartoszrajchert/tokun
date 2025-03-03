"use client";

import { useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import atomOneDark from "react-syntax-highlighter/dist/cjs/styles/hljs/atom-one-dark";
import { build } from "tokun";
import {
  FormatName,
  formatNames,
  generateConfig,
  LoaderName,
  loaderNames,
} from "tokun/utils";
import { dtcgValidator, ValidatorError } from "tokun/validators";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { InfoIcon } from "lucide-react";
import { Dropdown } from "./dropdown";

export default function ShowcaseForm() {
  const [errors, setErrors] = useState<ValidatorError[]>([]);
  const [parsed, setParsed] = useState<
    {
      filePath: string;
      content: string;
    }[]
  >();
  const [format, setFormat] = useState<string>("");
  const [loader, setLoader] = useState<string>("");
  const [value, setValue] = useState<string>("");

  async function handleParse() {
    const config = generateConfig({
      loader: loader as LoaderName,
      format: format as FormatName,
    });

    try {
      const tokens = build({
        data: JSON.parse(value),
        options: config,
      });

      if (tokens) {
        setParsed(tokens);
      }
    } catch (error) {
      console.error(error);
    }
  }

  function handleValidate() {
    const json = document.querySelector("textarea")!.value;

    try {
      const result = dtcgValidator(JSON.parse(json));
      setErrors(result.errors);
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div>
      <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => e.preventDefault()}
        >
          <Label htmlFor="name">JSON</Label>
          <div className="grid h-full grid-rows-2 gap-6 lg:grid-cols-2 lg:grid-rows-1">
            <Textarea
              placeholder="Write your JSON here"
              className="h-full min-h-[300px] lg:min-h-[500px] xl:min-h-[500px]"
              onChange={(e) => setValue(e.target.value)}
            />
            <div className="bg-muted rounded-md border">
              {parsed && parsed[0] && (
                <SyntaxHighlighter
                  language="json"
                  style={atomOneDark}
                  customStyle={{
                    fontSize: "14px",
                    background: "hsl(var(--muted))",
                  }}
                >
                  {parsed[0].content}
                </SyntaxHighlighter>
              )}
            </div>
          </div>
        </form>
        <div className="space-y-4">
          <Dropdown
            label="Loader"
            placeholder="Select loader..."
            value={loader}
            setValue={setLoader}
            items={loaderNames as unknown as string[]}
          />
          <Dropdown
            label="Format"
            placeholder="Select format..."
            value={format}
            setValue={setFormat}
            items={formatNames as unknown as string[]}
          />
          <div className="flex gap-1.5">
            <InfoIcon size={14} className="mt-1 flex-shrink-0" />
            <small>
              Transforms are automatically applied when choosing a format
            </small>
          </div>
          <Separator />
          <div className="flex gap-2">
            <Button
              onClick={handleParse}
              className="w-full"
              disabled={!format || !loader || value.trim() === ""}
            >
              Parse
            </Button>
            <Button
              onClick={handleValidate}
              variant="secondary"
              disabled={!format || !loader || value.trim() === ""}
            >
              Validate
            </Button>
          </div>
        </div>
      </div>
      <div className="space-y-2">
        {errors.map((err, i) => (
          <p key={i}>{JSON.stringify(err, null, 2)}</p>
        ))}
      </div>
    </div>
  );
}
