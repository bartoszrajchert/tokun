import { capitalize } from "@/lib/utils";
import matter from "gray-matter";
import fs from "node:fs";
import path from "node:path";
import { glob } from "tinyglobby";
import { sidebarConfig } from "./sidebar";

export const DEFAULT_SLUG = "getting-started/introduction";

export type Metadata = {
  title?: string;
  description?: string;
  order?: string;
  maxTocDepth?: number;
};

export type MDXData = {
  metadata: Metadata;
  slug: string[];
  content: string;
  toc: Heading[];
};

export type Heading = {
  slug: string;
  title: string;
  level: number;
};

export type MDXDataGroupedBySlug = {
  metadata: Metadata;
  slug: string | string[];
  content?: string;
  children?: MDXDataGroupedBySlug[];
  root?: boolean;
};

export function getDocs() {
  const pathToDocs = path.join(process.cwd(), "app", "docs");
  return getMDXData(pathToDocs);
}

function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, "utf-8");
  const { data: metadata, content } = matter(rawContent);

  if (metadata.title === undefined) {
    metadata.title = path.basename(filePath).split(".")[0];
  }

  const toc = generateToc(rawContent);

  return {
    metadata,
    content,
    toc,
  };
}

async function getMDXData(dir: string): Promise<MDXData[]> {
  const mdxFiles = await glob([`${dir}/**/*.(mdx|md)`]);

  const ret = await Promise.all(
    mdxFiles.map(async (file) => {
      const { metadata, content, toc } = readMDXFile(file);
      const slug = file.split("/content/")[1].split(".")[0].split("/");

      return {
        metadata,
        slug,
        content,
        toc,
      };
    }),
  );

  return ret;
}

export function groupBySlug(input: MDXData[]): MDXDataGroupedBySlug[] {
  const buildTree = (
    items: MDXData[],
    depth: number,
  ): MDXDataGroupedBySlug[] => {
    const tree: Record<string, MDXDataGroupedBySlug> = {};

    items.forEach((item) => {
      const currentSlug = item.slug[depth];
      if (!currentSlug) return;

      if (!tree[currentSlug]) {
        const primaryItem = items.find((pItem) =>
          item.slug.join().endsWith(pItem.slug[depth]),
        );

        const root = !primaryItem;
        const sidebarInfo = sidebarConfig.info.find(
          (item) => item.slug === currentSlug,
        );
        const sidebarIndex = sidebarInfo
          ? sidebarConfig.info.indexOf(sidebarInfo)
          : undefined;

        tree[currentSlug] = {
          root: root,
          metadata: {
            title: primaryItem
              ? primaryItem.metadata.title
              : (sidebarInfo?.name ?? capitalize(currentSlug)),
            order: root ? String(sidebarIndex) : primaryItem.metadata.order,
          },
          slug: root ? item.slug[0] : item.slug.join("/"),
        };
      }

      if (item.slug.length === depth + 1) {
        tree[currentSlug].content = item.content;
      } else {
        tree[currentSlug].children = tree[currentSlug].children || [];
        tree[currentSlug].children!.push(item);
      }
    });

    // Process children recursively
    return Object.values(tree).map((node) => {
      if (node.children) {
        node.children = buildTree(
          node.children as unknown as MDXData[],
          depth + 1,
        );
      }
      return node;
    });
  };

  return buildTree(input, 0);
}

function generateToc(content: string): Array<Heading> {
  const headings: Array<Heading> = [];
  const headingMatcher = /^(#+)\s(.+)$/gm;

  let match = headingMatcher.exec(content);
  while (match !== null) {
    const level = match[1].length;
    const title = match[2].trim().replaceAll("\\_", "_");
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

    headings.push({ slug, title, level });
    match = headingMatcher.exec(content);
  }

  return headings;
}
