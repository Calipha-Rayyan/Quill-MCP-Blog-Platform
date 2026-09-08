import { Router } from "express";
import type { Request } from "express";

import type { ApiKeyService } from "../services/apiKeyService.js";
import type { AnalyticsService } from "../services/analyticsService.js";
import type { OAuthService } from "../services/oauthService.js";
import type { PostService } from "../services/postService.js";

import type { PostStatus } from "../types/post.js";

type JsonRecord = Record<string, unknown>;

type McpRequest = {
  jsonrpc?: unknown;
  id?: unknown;
  method?: unknown;
  params?: unknown;
};

type McpToolResult = {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
};

const postStatusValues = new Set<PostStatus>([
  "draft",
  "published",
  "scheduled",
]);

const stringSchema = {
  type: "string",
};

const nullableStringSchema = {
  anyOf: [
    { type: "string" },
    { type: "null" },
  ],
};

const toolDefinitions = [
  definition(
    "create_post",
    "Create a draft blog post.",
    {
      title: stringSchema,
      content_md: stringSchema,
    },
    ["title", "content_md"],
  ),

  definition(
    "update_post",
    "Update a post you own.",
    {
      id: stringSchema,
      title: stringSchema,
      slug: stringSchema,
      content_md: stringSchema,
    },
  ),

  definition(
    "delete_post",
    "Delete a post you own.",
    {
      id: stringSchema,
    },
    ["id"],
  ),

  definition(
    "list_posts",
    "List your posts.",
    {
      status: {
        type: "string",
        enum: [...postStatusValues],
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
      },
    },
  ),

  definition(
    "get_post",
    "Get a post you own.",
    {
      id: stringSchema,
    },
    ["id"],
  ),

  definition(
    "publish_post",
    "Publish a post you own immediately.",
    {
      id: stringSchema,
    },
    ["id"],
  ),

  definition(
    "schedule_post",
    "Schedule a post for future publication.",
    {
      id: stringSchema,
      publish_at: {
        type: "string",
        format: "date-time",
      },
    },
    ["id", "publish_at"],
  ),

  definition(
    "unpublish_post",
    "Return a published or scheduled post to draft.",
    {
      id: stringSchema,
    },
    ["id"],
  ),

  definition(
    "manage_seo",
    "Set or clear a post's SEO metadata.",
    {
      id: stringSchema,
      meta_title: nullableStringSchema,
      meta_description: nullableStringSchema,
    },
    ["id"],
  ),

  definition(
    "get_analytics",
    "Get analytics totals for your posts.",
    {},
  ),
];

function definition(
  name: string,
  description: string,
  properties: JsonRecord,
  required: string[] = [],
) {
  return {
    name,
    description,
    inputSchema: {
      type: "object",
      properties,
      ...(required.length ? { required } : {}),
      additionalProperties: false,
    },
  };
}

/**
 * Remote MCP endpoint using the Streamable HTTP JSON-RPC message shape.
 *
 * Authentication supports:
 * 1. Existing Quill API keys
 * 2. OAuth access tokens for remote MCP clients such as Claude.ai
 *
 * All blog operations continue to use the shared services.
 */
export function createMcpRouter(services: {
  apiKeyService: ApiKeyService;
  oauthService: OAuthService;
  postService: PostService;
  analyticsService: AnalyticsService;
}): Router {
  const router = Router();

  router.post("/", (req, res) => {
    const userId = authenticateRequest(
      req.header("Authorization"),
      req,
      services.apiKeyService,
      services.oauthService,
    );

    if (!userId) {
      const resourceMetadataUrl =
        getResourceMetadataUrl(req);

      res.setHeader(
        "WWW-Authenticate",
        `Bearer resource_metadata="${resourceMetadataUrl}"`,
      );

      res.status(401).json({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32001,
          message:
            "Invalid or missing MCP authentication",
        },
      });

      return;
    }

    const message = req.body as McpRequest;

    if (
      message.jsonrpc !== "2.0" ||
      typeof message.method !== "string"
    ) {
      res.status(400).json({
        jsonrpc: "2.0",
        id: message?.id ?? null,
        error: {
          code: -32600,
          message: "Invalid JSON-RPC request",
        },
      });

      return;
    }

    if (
      message.method ===
      "notifications/initialized"
    ) {
      res.status(202).end();
      return;
    }

    const result = dispatch(
      message.method,
      message.params,
      userId,
      services,
    );

    if (message.id === undefined) {
      res.status(202).end();
      return;
    }

    res.json({
      jsonrpc: "2.0",
      id: message.id,
      ...(
        "error" in result
          ? result
          : { result: result.result }
      ),
    });
  });

  router.get("/", (_req, res) =>
    res.status(405).json({
      error:
        "Use POST for MCP JSON-RPC messages",
    }),
  );

  return router;
}

function dispatch(
  method: string,
  params: unknown,
  userId: string,
  services: Parameters<typeof createMcpRouter>[0],
):
  | { result: unknown }
  | { error: JsonRecord } {
  if (method === "initialize") {
    return {
      result: {
        protocolVersion: "2025-03-26",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "quill",
          version: "0.1.0",
        },
      },
    };
  }

  if (method === "tools/list") {
    return {
      result: {
        tools: toolDefinitions,
      },
    };
  }

  if (method !== "tools/call") {
    return {
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    };
  }

  const call = asRecord(params);

  const name =
    call &&
    typeof call.name === "string"
      ? call.name
      : null;

  const args =
    call &&
    asRecord(call.arguments);

  if (!name || !args) {
    return {
      error: {
        code: -32602,
        message:
          "tools/call requires a tool name and object arguments",
      },
    };
  }

  return {
    result: executeTool(
      name,
      args,
      userId,
      services,
    ),
  };
}

function executeTool(
  name: string,
  args: JsonRecord,
  userId: string,
  services: Parameters<typeof createMcpRouter>[0],
): McpToolResult {
  try {
    let value: unknown;

    switch (name) {
      case "create_post":
        value =
          services.postService.createPost(
            userId,
            requiredString(
              args,
              "title",
            ),
            requiredString(
              args,
              "content_md",
            ),
          );
        break;

      case "update_post":
        value = found(
          services.postService.updatePost(
            userId,
            requiredString(
              args,
              "id",
            ),
            postPatch(args),
          ),
        );
        break;

      case "delete_post":
        value = foundBoolean(
          services.postService.deletePost(
            userId,
            requiredString(
              args,
              "id",
            ),
          ),
        );
        break;

      case "list_posts":
        value =
          services.postService.listPosts(
            userId,
            optionalStatus(
              args.status,
            ),
            optionalLimit(
              args.limit,
            ),
          );
        break;

      case "get_post":
        value = found(
          services.postService.getPost(
            userId,
            requiredString(
              args,
              "id",
            ),
          ),
        );
        break;

      case "publish_post":
        value = found(
          services.postService.publishPost(
            userId,
            requiredString(
              args,
              "id",
            ),
          ),
        );
        break;

      case "schedule_post":
        value = found(
          services.postService.schedulePost(
            userId,
            requiredString(
              args,
              "id",
            ),
            requiredString(
              args,
              "publish_at",
            ),
          ),
        );
        break;

      case "unpublish_post":
        value = found(
          services.postService.unpublishPost(
            userId,
            requiredString(
              args,
              "id",
            ),
          ),
        );
        break;

      case "manage_seo":
        value = found(
          services.postService.updatePost(
            userId,
            requiredString(
              args,
              "id",
            ),
            seoPatch(args),
          ),
        );
        break;

      case "get_analytics":
        value =
          services.analyticsService.getAnalytics(
            userId,
          );
        break;

      default:
        throw new Error(
          `Unknown tool: ${name}`,
        );
    }

    return text(value);
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error:
              error instanceof Error
                ? error.message
                : "Tool execution failed",
          }),
        },
      ],
      isError: true,
    };
  }
}

function authenticateRequest(
  header: string | undefined,
  req: Request,
  apiKeyService: ApiKeyService,
  oauthService: OAuthService,
): string | null {
  const token =
    header?.match(
      /^Bearer\s+(.+)$/i,
    )?.[1];

  if (!token) {
    return null;
  }

  /*
   * First try the existing Quill API key.
   *
   * This keeps MCP Inspector and existing
   * API-key clients working.
   */
  const apiKeyUserId =
    apiKeyService.authenticateKey(
      token,
    );

  if (apiKeyUserId) {
    return apiKeyUserId;
  }

  /*
   * If it isn't an API key, try the OAuth
   * access token used by remote MCP clients.
   */
  const resource =
    getMcpResource(req);

  return oauthService.authenticateAccessToken(
    token,
    resource,
  );
}

function getBaseUrl(
  req: Request,
): string {
  const forwardedProto =
    req.header(
      "x-forwarded-proto",
    ) ?? req.protocol;

  const forwardedHost =
    req.header(
      "x-forwarded-host",
    ) ?? req.get("host");

  return `${forwardedProto}://${forwardedHost}`;
}

function getMcpResource(
  req: Request,
): string {
  return `${getBaseUrl(req)}/mcp`;
}

function getResourceMetadataUrl(
  req: Request,
): string {
  return `${getBaseUrl(req)}/.well-known/oauth-protected-resource`;
}

function asRecord(
  value: unknown,
): JsonRecord | null {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
    ? (value as JsonRecord)
    : null;
}

function requiredString(
  args: JsonRecord,
  name: string,
): string {
  if (
    typeof args[name] !== "string" ||
    !args[name].trim()
  ) {
    throw new Error(
      `${name} is required`,
    );
  }

  return args[name];
}

function optionalStatus(
  value: unknown,
): PostStatus | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "string" ||
    !postStatusValues.has(
      value as PostStatus,
    )
  ) {
    throw new Error(
      "status must be draft, published, or scheduled",
    );
  }

  return value as PostStatus;
}

function optionalLimit(
  value: unknown,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value)
  ) {
    throw new Error(
      "limit must be an integer",
    );
  }

  return value;
}

function postPatch(
  args: JsonRecord,
) {
  const patch = pick(
    args,
    [
      "title",
      "slug",
      "content_md",
    ],
  );

  if (!Object.keys(patch).length) {
    throw new Error(
      "At least one post field is required",
    );
  }

  return patch;
}

function seoPatch(
  args: JsonRecord,
) {
  const patch = pick(
    args,
    [
      "meta_title",
      "meta_description",
    ],
    true,
  );

  if (!Object.keys(patch).length) {
    throw new Error(
      "At least one SEO field is required",
    );
  }

  return patch;
}

function pick(
  args: JsonRecord,
  fields: string[],
  nullable = false,
): Record<
  string,
  string | null
> {
  const patch: Record<
    string,
    string | null
  > = {};

  for (const field of fields) {
    const value = args[field];

    if (
      typeof value === "string" ||
      (nullable && value === null)
    ) {
      patch[field] = value;
    } else if (
      value !== undefined
    ) {
      throw new Error(
        `${field} must be ${
          nullable
            ? "a string or null"
            : "a string"
        }`,
      );
    }
  }

  return patch;
}

function found<T>(
  value: T | null,
): T {
  if (!value) {
    throw new Error(
      "Post not found",
    );
  }

  return value;
}

function foundBoolean(
  value: boolean,
): { deleted: true } {
  if (!value) {
    throw new Error(
      "Post not found",
    );
  }

  return {
    deleted: true,
  };
}

function text(
  value: unknown,
): McpToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(value),
      },
    ],
  };
}