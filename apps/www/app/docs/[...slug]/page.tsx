import { notFound } from "next/navigation";
import React from "react";
import { TocTree } from "../components/toc-tree";
import { CustomMDX } from "../mdx";
import { getDocs } from "../utils";

type Props = {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateStaticParams() {
  const docs = await getDocs();

  return docs.map(({ slug }) => ({
    slug,
  }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const post = (await getDocs()).find(
    (post) => post.slug.join("/") === slug.join("/"),
  );
  if (!post) {
    return;
  }

  const { title } = post.metadata;

  return {
    title,
  };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  const post = (await getDocs()).find(
    (post) => post.slug.join("/") === slug.join("/"),
  );

  if (!post) {
    notFound();
  }

  return (
    <section className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_200px]">
      <article className="mx-auto w-full min-w-0 max-w-2xl relative prose dark:prose-invert prose-pre:bg-slate-100 dark:prose-pre:bg-slate-900">
        <CustomMDX source={post.content} />
      </article>
      <TocTree post={post} />
    </section>
  );
}
