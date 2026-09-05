// MCP tool: publish_post
// -----------------------------------------------------------------------
// Mirrors section 12 ("Example: Publishing") of the team contract:
// when the user asks to publish a post, this tool calls the shared
// publish logic, sets status to "published" and sets published_at.
//
// Same temporary caveat as create_post: "asUserId" stands in for real
// auth-derived user context until src/mcp/auth.ts is wired up.
// -----------------------------------------------------------------------

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { publishPost } from "../../services/mockPostService.js";

export function registerPublishPostTool(server: McpServer): void {
  server.tool(
    "publish_post",
    "Publish an existing post by id.",
    {
      postId: z.string().min(1, "postId is required"),
      // TEMPORARY -- remove once real auth context exists.
      asUserId: z.string().default("dev-user-1"),
    },
    async ({ postId, asUserId }) => {
      const post = publishPost(asUserId, postId);

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
            text: `Published post "${post.title}" (id: ${post.id}) at ${post.published_at}`,
          },
        ],
      };
    }
  );
}