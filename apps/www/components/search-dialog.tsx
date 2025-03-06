"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

export default function SearchDialog() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState([]);
  const [open, setOpen] = React.useState(false);

  useEffect(() => {
    async function loadPagefind() {
      // @ts-ignore
      if (typeof window.pagefind === "undefined") {
        try {
          // @ts-ignore
          window.pagefind = await import(
            // @ts-expect-error pagefind.js generated after build
            /* webpackIgnore: true */ "./pagefind/pagefind.js"
          );
        } catch (e) {
          // @ts-ignore
          window.pagefind = {
            search: () => ({
              results: [
                {
                  id: "en_8bceec9",
                  data: async function data() {
                    return {
                      url: "/docs/",
                      excerpt: "Documentation page.",
                      meta: {
                        title: "Documentation",
                        image: "/weka.png",
                      },
                      sub_results: [
                        {
                          title: "Introduction",
                          url: "/getting-started/introduction",
                          excerpt:
                            "A small snippet of the <mark>static</mark> content, with the search term(s) highlighted in &lt;mark&gt; elements",
                        },
                        {
                          title: "Basic usage",
                          url: "/getting-started/basic-usage",
                          excerpt:
                            "A snippet of the <mark>static</mark> content, scoped between this anchor and the next one",
                        },
                      ],
                    };
                  },
                },
                {
                  id: "en_6fceec8",
                  data: async function data() {
                    return {
                      url: "/playground/",
                      excerpt: "Test Tokun in the playgorund",
                      meta: {
                        title: "Playground",
                      },
                    };
                  },
                },
              ],
            }),
          };
          console.log(e);
        }
      }
    }
    loadPagefind();
  }, []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  useEffect(() => {
    async function handleSearch() {
      // @ts-ignore
      if (window.pagefind) {
        // @ts-ignore
        const search = await window.pagefind.search(query);
        setResults(search.results);
      }
    }

    handleSearch();
  }, [query]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(!open)}>
        <SearchIcon /> Search{" "}
        <kbd className="bg-muted text-muted-foreground pointer-events-none ml-1 hidden h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 md:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        commandProps={{
          shouldFilter: false,
        }}
      >
        <CommandInput
          placeholder="Search..."
          value={query}
          onValueChange={(e) => setQuery(e)}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {results.map((result: any) => {
            return <Result key={result.id} result={result} />;
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Result({ result }: { result: any }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      const data = await result.data();
      setData(data);
    }
    fetchData();
  }, [result]);

  if (!data) return null;

  return (
    <CommandItem value={result.id}>
      <Link href={data.url}>
        <h3>{data.meta.title}</h3>
        <p
          className="text-foreground/60"
          dangerouslySetInnerHTML={{ __html: data.excerpt }}
        ></p>
      </Link>
    </CommandItem>
  );
}
