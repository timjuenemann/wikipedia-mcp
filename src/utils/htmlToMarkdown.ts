import TurndownService, { type TagName } from "turndown";

/**
 * Converts HTML content to Markdown with proper cleaning
 * @param htmlContent The HTML content to convert
 * @returns Clean markdown string
 */
export function convertHtmlToMarkdown(htmlContent: string): string {
  // Initialize turndown service
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    emDelimiter: "*",
  });

  // Remove unwanted elements
  const elementsToRemove: TagName[] = [
    "script",
    "style",
    "link",
    "meta",
    "iframe",
    "noscript",
    "object",
    "embed",
  ];

  for (const tag of elementsToRemove) {
    turndownService.remove(tag);
  }

  const markdown = turndownService.turndown(htmlContent);

  return markdown;
}
