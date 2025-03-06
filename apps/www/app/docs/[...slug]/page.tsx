import { notFound } from "next/navigation";
import React from "react";
import BreadcrumbPathname from "../components/breadcrumb-pathname";
import PrevNextPage from "../components/prev-next-page";
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
  const docs = await getDocs();
  const post = docs.find((post) => post.slug.join("/") === slug.join("/"));

  if (!post) {
    notFound();
  }

  return (
    <section className="sm:h-screen-with-nav relative flex">
      <div className={"mx-auto w-full overflow-auto xl:mr-auto"}>
        <div className="mx-auto w-full max-w-[65ch] px-8">
          <BreadcrumbPathname />
          <article className="prose dark:prose-invert prose-pre:bg-accent dark:prose-pre:bg-accent relative mx-auto w-full">
            <CustomMDX source={post.content} />
          </article>
          <PrevNextPage data={docs} />
        </div>
      </div>

      <TocTree post={post} />
    </section>
  );
}
