import { Button } from "@/components/ui/button";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import { Code } from "@/components/code";
import { PackageManagerTabs } from "@/components/package-manager-tabs";
import Image from "next/image";
import Link from "next/link";
import React, { type ReactNode } from "react";

function CustomLink(props: React.ComponentPropsWithoutRef<"a">) {
  const href = props.href ?? "";
  const markdownWithAnchorFileRegex = /\.mdx?(?:$|#.+$)/;

  if (href.startsWith("/") || markdownWithAnchorFileRegex.test(href)) {
    const cleanHref = href.replace(".md", "").replace(".mdx", "");

    return (
      <Link {...props} href={cleanHref}>
        {props.children}
      </Link>
    );
  }

  if (href.startsWith("#")) {
    return <a {...props} />;
  }

  return <a target="_blank" rel="noopener noreferrer" {...props} />;
}

function RoundedImage({ alt, ...props }: React.ComponentProps<typeof Image>) {
  return <Image {...props} alt={alt} className="rounded-lg" />;
}

function slugify(str: string) {
  return str
    .toString()
    .toLowerCase()
    .trim() // Remove whitespace from both ends of a string
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w\-]+/g, "") // Remove all non-word characters except for -
    .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

function extractTextContent(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => extractTextContent(entry)).join(" ");
  }

  if (React.isValidElement<{ children?: ReactNode }>(value)) {
    return extractTextContent(value.props.children);
  }

  return "";
}

function getCodeString(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => getCodeString(entry)).join("");
  }

  if (React.isValidElement<{ children?: ReactNode }>(value)) {
    return getCodeString(value.props.children);
  }

  return "";
}

function MdxCode({
  children,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"code">) {
  const code = getCodeString(children).replace(/\n$/, "");
  const isCodeBlock = Boolean(className?.includes("language-"));

  if (isCodeBlock) {
    return (
      <Code className={className} {...props}>
        {code}
      </Code>
    );
  }

  const inlineClassName = ["docs-inline-code", className]
    .filter(Boolean)
    .join(" ");

  return (
    <Code className={inlineClassName} {...props}>
      {code}
    </Code>
  );
}

function createHeading(level: 1 | 2 | 3 | 4 | 5 | 6) {
  const Heading = ({ children }: { children: ReactNode }) => {
    const slug = slugify(extractTextContent(children));

    return React.createElement(
      `h${level}`,
      { id: slug },
      React.createElement("a", {
        href: `#${slug}`,
        className: "anchor",
      }),
      children,
    );
  };

  Heading.displayName = `Heading${level}`;

  return Heading;
}

const components = {
  h1: createHeading(1),
  h2: createHeading(2),
  h3: createHeading(3),
  h4: createHeading(4),
  h5: createHeading(5),
  h6: createHeading(6),
  Image: RoundedImage,
  a: CustomLink,
  code: MdxCode,
  Button,
  PackageManagerTabs,
};

export async function CustomMDX({ source }: { source: string }) {
  const mdxSource = await compileMDX({
    source,
    components,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [],
      },
    },
  });

  return mdxSource.content;
}
