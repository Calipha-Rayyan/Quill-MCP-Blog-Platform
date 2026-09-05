// MCP tool: list_posts
// -----------------------------------------------------------------------
// Lists all posts belonging to the authenticated user.
// Same temporary "asUserId" caveat as the other tools -- see
// src/mcp/auth.ts (TODO) for real auth-derived user context.
// -----------------------------------------------------------------------

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { listPosts } from "../../services/mockPostService.js";

export function registerListPostsTool(server: McpServer): void {
  server.tool(
    "list_posts",
    "List all posts belonging to the current user.",
    {
      // TEMPORARY -- remove once real auth context exists.
      asUserId: z.string().default("dev-user-1"),
    },
    async ({ asUserId }) => {
      const posts = listPosts(asUserId);

      if (posts.length === 0) {
        return {
          content: [{ type: "text", text: "No posts found." }],
        };
      }

      const summary = posts
        .map((p) => `- [${p.status}] "${p.title}" (id: ${p.id})`)
        .join("\n");

      return {
        content: [{ type: "text", text: summary }],
      };
    }
  );
}