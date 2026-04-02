"use client";

import { SearchIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

type PagefindResultData = {
  url: string;
  excerpt: string;
  meta: {
    title: string;
    image?: string;
  };
  sub_results?: {
    title: string;
    url: string;
    excerpt: string;
  }[];
};

type PagefindResult = {
  id: string;
  data: () => Promise<PagefindResultData>;
};

type PagefindSearchResponse = {
  results: PagefindResult[];
};

type PagefindApi = {
  search:
    | ((query: string) => PagefindSearchResponse)
    | ((query: string) => Promise<PagefindSearchResponse>);
};

declare global {
  interface Window {
    pagefind?: PagefindApi;
  }
}

export default function SearchDialog() {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<PagefindResult[]>([]);
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  useEffect(() => {
    async function loadPagefind() {
      if (typeof window.pagefind === "undefined") {
        try {
          const modulePath = "./pagefind/pagefind.js";
          window.pagefind = (await import(
            /* webpackIgnore: true */ modulePath
          )) as unknown as PagefindApi;
        } catch (error) {
          window.pagefind = {
            search: () => ({
              results: mockResults,
            }),
          };
          console.log(error);
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
      if (window.pagefind) {
        const search = await window.pagefind.search(query);
        setResults(search.results);
      }
    }

    handleSearch();
  }, [query]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(!open)}>
        <SearchIcon /> Search{" "}
        <kbd className="bg-muted text-muted-foreground pointer-events-none ml-1 hidden h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 md:inline-flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search..."
          value={query}
          onValueChange={(e) => setQuery(e)}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {results.map((result) => {
            return <Result key={result.id} result={result} />;
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
}

function Result({ result }: { result: PagefindResult }) {
  const [data, setData] = useState<PagefindResultData | null>(null);

  function cleanLink(url: string) {
    return url
      .replaceAll("_next/static/chunks/app/", "")
      .replaceAll(".html", "");
  }

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
      <Link href={cleanLink(data.url)}>
        <h3>{data.meta.title}</h3>
        <p
          className="text-foreground/60"
          dangerouslySetInnerHTML={{ __html: data.excerpt }}
        ></p>
      </Link>
    </CommandItem>
  );
}

/**
 * Mock results for the search dialog.
 * Used only in development mode.
 */
const mockResults: PagefindResult[] = [
  {
    id: "en_8bceec9",
    data: async function data() {
      return {
        url: "/docs/",
        excerpt:
          "A small snippet of the <mark>static</mark> content, with the search term(s) highlighted in &lt;mark&gt; elements",
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
];
