import { getDocs } from "./docs/utils";

export const baseUrl = "https://example.com";

export default async function sitemap() {
  const docs = (await getDocs()).map((doc) => ({
    url: `${baseUrl}/docs/${doc.slug}`,
  }));

  const routes = ["", "/docs", "/playground"].map((route) => ({
    url: `${baseUrl}${route}`,
  }));

  return [...docs, ...routes];
}
