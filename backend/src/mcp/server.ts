// Quill MCP Server -- entry point
// Uses the official MCP TypeScript SDK with Streamable HTTP transport,
// per section 2 ("Agreed Technology Foundation") of the team contract doc.
//
// This is intentionally minimal for now: it exposes the MCP endpoint and
// registers tools from src/mcp/tools/. Auth (API key -> user context) is
// wired in src/mcp/auth.ts once apiKeyService exists on feature/core-db.

import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerCreatePostTool } from "./tools/createPost.js";
import { registerPublishPostTool } from "./tools/publishPost.js";
import { registerListPostsTool } from "./tools/listPosts.js";
import { registerGetPostTool } from "./tools/getPost.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3333;

function buildServer(): McpServer {
  const server = new McpServer({
    name: "quill-mcp-server",
    version: "0.1.0",
  });

  registerCreatePostTool(server);
  registerPublishPostTool(server);
  registerListPostsTool(server);
  registerGetPostTool(server);
  return server;
}

async function main() {
  const app = express();
  app.use(express.json());

  app.post("/mcp", async (req, res) => {
    // Stateless mode: a fresh server + transport per request.
    // This keeps things simple for now; can move to session-based
    // transport later if we need persistent connections per client.
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({});

    res.on("close", () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  // Simple health check so we can confirm the server is up without
  // going through the MCP protocol itself.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", service: "quill-mcp-server" });
  });

  app.listen(PORT, () => {
    console.log(`Quill MCP server listening on http://localhost:${PORT}`);
    console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });
}

main().catch((err) => {
  console.error("Failed to start Quill MCP server:", err);
  process.exit(1);
});