// MCP tool: get_post
// -----------------------------------------------------------------------
// Fetches a single post by id, scoped to the authenticated user.
// Same temporary "asUserId" caveat as the other tools -- see
// src/mcp/auth.ts (TODO) for real auth-derived user context.
// -----------------------------------------------------------------------

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getPost } from "../../services/mockPostService.js";

export function registerGetPostTool(server: McpServer): void {
  server.tool(
    "get_post",
    "Get a single post by id.",
    {
      postId: z.string().min(1, "postId is required"),
      // TEMPORARY -- remove once real auth context exists.
      asUserId: z.string().default("dev-user-1"),
    },
    async ({ postId, asUserId }) => {
      const post = getPost(asUserId, postId);

      if (!post) {
        return {
          content: [
            {
              type: "text",
              text: `No post found with id "${postId}" for this user.`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(post, null, 2),
          },
        ],
      };
    }
  );
}