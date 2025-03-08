// @ts-check
import { MarkdownPageEvent } from "typedoc-plugin-markdown";

/**
 * @param {import('typedoc-plugin-markdown').MarkdownApplication} app
 */
export function load(app) {
  // Capitalize the first letter of the title
  app.renderer.on(MarkdownPageEvent.END, (page) => {
    if (!page.contents) {
      return;
    }

    const topHeadingRegex = /^(#)\s(.+)$/m;
    const matches = topHeadingRegex.exec(page.contents);

    if (matches) {
      page.contents = page.contents.replace(
        topHeadingRegex,
        `$1 ${capitalize(matches[2])}`,
      );
    }
  });

  // Set the max TOC depth to 3
  app.renderer.on(
    MarkdownPageEvent.BEGIN,
    /** @param {import('typedoc-plugin-markdown').MarkdownPageEvent} page */
    (page) => {
      page.frontmatter = {
        title: capitalize(page.model?.name),
        maxTocDepth: 3,
        ...page.frontmatter,
      };
    },
  );
}

function capitalize(s) {
  return s && String(s[0]).toUpperCase() + String(s).slice(1);
}
