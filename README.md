# Wikipedia MCP Server

A Model Context Protocol (MCP) server for searching and retrieving Wikipedia articles.

## Overview

This MCP server enables language models to search Wikipedia and retrieve article content programmatically using the Model Context Protocol. It provides a structured interface for AI assistants to access Wikipedia knowledge.

## Features

- **Search Wikipedia**: Find articles matching specific search terms
- **Read Full Articles**: Retrieve complete Wikipedia articles by title or page ID
- **Markdown Conversion**: All article content is automatically converted from HTML

## Add it to your MCP Client

Start it via this CLI command:

```
npx wikipedia-mcp
```

Most AI tools support a JSON-based configuration for MCP servers looking like this:

```json
{
  "mcpServers": {
    "Wikipedia": {
      "command": "npx",
      "args": ["-y", "wikipedia-mcp"]
    }
  }
}
```