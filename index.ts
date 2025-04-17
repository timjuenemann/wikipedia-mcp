#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { convertHtmlToMarkdown } from "./src/utils/htmlToMarkdown.js";

// Constants
const USER_AGENT =
  "WikipediaMCPServer/1.0.0 (https://github.com/timjuenemann/wikipedia-mcp)";
const WIKIPEDIA_API_URL = "https://en.wikipedia.org/w/api.php";

// Interfaces
interface WikipediaSearchResult {
  title: string;
  snippet: string;
  pageid: number;
}

// Helper functions
/**
 * Generic function to fetch data from Wikipedia API
 */
async function fetchFromWikipedia(params: Record<string, string>) {
  const url = new URL(WIKIPEDIA_API_URL);
  // Set common parameters
  url.searchParams.set("format", "json");

  // Add all provided parameters to the URL
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`Wikipedia API request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Search Wikipedia for articles matching a query
 */
async function searchWikipedia(query: string) {
  const data = await fetchFromWikipedia({
    action: "query",
    list: "search",
    srsearch: query,
  });

  return (data?.query?.search || []).map((item: WikipediaSearchResult) => {
    const markdownSnippet = convertHtmlToMarkdown(item.snippet || "");

    return {
      title: item.title,
      snippet: markdownSnippet,
      url: `https://en.wikipedia.org/?curid=${item.pageid}`,
      pageId: item.pageid,
    };
  });
}

/**
 * Get a Wikipedia article by title or page ID
 */
async function getWikipediaArticle(options: {
  title?: string;
  pageId?: number;
}) {
  const { title, pageId } = options;

  const params: Record<string, string> = {
    action: "parse",
    prop: "text",
    formatversion: "2", // Request format version 2 for simpler output
  };

  if (pageId) {
    params.pageid = String(pageId);
  } else if (title) {
    params.page = title;
  } else {
    throw new Error("Either title or pageId must be provided");
  }

  const data = await fetchFromWikipedia(params);

  if (data.error) {
    throw new Error(`Error reading article: ${data.error.info}`);
  }

  const articleText = data?.parse?.text;
  if (!articleText) {
    throw new Error("Could not find content for the specified article");
  }

  return convertHtmlToMarkdown(articleText);
}

// Create MCP server
const server = new McpServer({
  name: "Wikipedia",
  description: "Search and retrieve Wikipedia articles",
  version: "1.0.0",
});

// Add a Wikipedia search tool
server.tool(
  "search",
  { query: z.string().describe("The search term for Wikipedia") },
  async ({ query }) => {
    try {
      const results = await searchWikipedia(query);

      if (results.length === 0) {
        return { content: [{ type: "text", text: "No results found." }] };
      }

      return { content: results };
    } catch (error) {
      console.error("Error fetching from Wikipedia:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error searching Wikipedia: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

// Add a Wikipedia article reading tool
server.tool(
  "readArticle",
  {
    title: z
      .string()
      .optional()
      .describe("The title of the Wikipedia article to read"),
    pageId: z
      .number()
      .optional()
      .describe("The page ID of the Wikipedia article to read"),
  },
  async ({ title, pageId }) => {
    // Validate that either title or pageId is provided
    if (!title && !pageId) {
      return {
        content: [
          {
            type: "text",
            text: "Error: Either title or pageId must be provided.",
          },
        ],
        isError: true,
      };
    }

    try {
      const markdown = await getWikipediaArticle({ title, pageId });
      return { content: [{ type: "text", text: markdown }] };
    } catch (error) {
      console.error("Error fetching from Wikipedia:", error);
      return {
        content: [
          {
            type: "text",
            text: `Error reading Wikipedia article: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      };
    }
  }
);

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch((error) => {
  console.error("Fatal error running server:", error);
  process.exit(1);
});
