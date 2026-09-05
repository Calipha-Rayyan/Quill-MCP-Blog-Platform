// MCP tool: create_post
// -----------------------------------------------------------------------
// Per the team contract (section 6, "User Isolation Rule"):
//   - This tool must NOT accept a raw user_id parameter.
//   - The user is identified from the authenticated MCP request context.
//
// Since real MCP auth (apiKeyService) isn't wired yet either, this tool
// currently takes a temporary "asUserId" parameter ONLY as a stand-in so
// the tool is testable end-to-end. This must be removed and replaced with
// real auth-derived user context before this is considered done -- see
// src/mcp/auth.ts (TODO).
// -----------------------------------------------------------------------

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createPost } from "../../services/mockPostService.js";

export function registerCreatePostTool(server: McpServer): void {
  server.tool(
    "create_post",
    "Create a new blog post (draft by default).",
    {
      title: z.string().min(1, "Title is required"),
      content_md: z.string().min(1, "Content is required"),
      status: z.enum(["draft", "published", "scheduled"]).optional(),
      meta_title: z.string().optional(),
      meta_description: z.string().optional(),
      scheduled_at: z.string().optional(),
      // TEMPORARY -- remove once real auth context exists.
      asUserId: z.string().default("dev-user-1"),
    },
    async ({ asUserId, ...input }) => {
      const post = createPost(asUserId, input);

      return {
        content: [
          {
            type: "text",
            text: `Created post "${post.title}" (id: ${post.id}, status: ${post.status})`,
          },
        ],
      };
    }
  );
}