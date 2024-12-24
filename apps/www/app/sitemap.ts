import { getDocs } from "./docs/utils";

export const dynamic = "force-static";

export const baseUrl = "https://withtokun.vercel.app/";

export default async function sitemap() {
  const docs = (await getDocs()).map((doc) => ({
    url: `${baseUrl}/docs/${doc.slug.join("/")}`,
  }));

  const routes = ["", "/docs", "/playground"].map((route) => ({
    url: `${baseUrl}${route}`,
  }));

  return [...docs, ...routes];
}
