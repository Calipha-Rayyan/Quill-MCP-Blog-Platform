import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import express from "express";
import { createMcpRouter } from "../../src/mcp/server.js";
import { createDatabase } from "../../src/db/database.js";
import { runMigrations } from "../../src/db/migrations/index.js";
import { AnalyticsRepository } from "../../src/db/repositories/analyticsRepository.js";
import { ApiKeyRepository } from "../../src/db/repositories/apiKeyRepository.js";
import { PostRepository } from "../../src/db/repositories/postRepository.js";
import { UserRepository } from "../../src/db/repositories/userRepository.js";
import { AnalyticsService } from "../../src/services/analyticsService.js";
import { ApiKeyService } from "../../src/services/apiKeyService.js";
import { AuthService } from "../../src/services/authService.js";
import { PostService } from "../../src/services/postService.js";

test("authenticated MCP endpoint exposes every tool and enforces ownership", async () => {
  const dir = mkdtempSync(join(tmpdir(), "quill-mcp-test-"));
  const db = createDatabase(join(dir, "test.db"));
  runMigrations(db);
  const auth = new AuthService(new UserRepository(db));
  const userA = auth.registerUser("mcp-a@example.com", "secure password");
  const userB = auth.registerUser("mcp-b@example.com", "secure password");
  const apiKeys = new ApiKeyService(new ApiKeyRepository(db));
  const postService = new PostService(new PostRepository(db));
  const analyticsService = new AnalyticsService(new AnalyticsRepository(db));
  const keyARecord = apiKeys.createKey(userA.id);
  const keyA = keyARecord.key;
  const keyB = apiKeys.createKey(userB.id).key;
  const app = express();
  app.use(express.json());
  app.use("/mcp", createMcpRouter({ apiKeyService: apiKeys, postService, analyticsService }));
  const server = await new Promise<import("node:http").Server>((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const endpoint = `http://127.0.0.1:${address.port}/mcp`;
  let id = 0;
  const rpc = async (key: string, method: string, params: object = {}) => {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params })
    });
    return { status: response.status, body: await response.json() as { result?: { tools?: Array<{ name: string; inputSchema: object }>; content?: Array<{ text: string }>; isError?: boolean } } };
  };
  const tool = async (key: string, name: string, args: object = {}) => {
    const response = await rpc(key, "tools/call", { name, arguments: args });
    assert.equal(response.status, 200);
    const result = response.body.result!;
    return { value: JSON.parse(result.content![0].text) as Record<string, unknown>, isError: result.isError === true };
  };

  try {
    const initialized = await rpc(keyA, "initialize", { protocolVersion: "2025-03-26", capabilities: {}, clientInfo: { name: "test", version: "1" } });
    assert.equal(initialized.body.result?.tools, undefined);
    const listed = await rpc(keyA, "tools/list");
    const tools = listed.body.result?.tools;
    assert.deepEqual(tools?.map((item) => item.name), [
      "create_post", "update_post", "delete_post", "list_posts", "get_post", "publish_post", "schedule_post", "unpublish_post", "manage_seo", "get_analytics"
    ]);
    for (const toolDefinition of tools ?? []) {
      assert.ok(toolDefinition.inputSchema);
      assert.equal(JSON.stringify(toolDefinition.inputSchema).includes("user_id"), false);
    }

    const created = await tool(keyA, "create_post", { title: "MCP post", content_md: "# MCP" });
    assert.equal(created.value.status, "draft");
    const postId = created.value.id as string;
    assert.equal((await tool(keyA, "update_post", { id: postId, content_md: "Updated" })).value.content_md, "Updated");
    assert.equal((await tool(keyA, "manage_seo", { id: postId, meta_title: "MCP SEO", meta_description: "Description" })).value.meta_title, "MCP SEO");
    assert.equal((await tool(keyA, "list_posts")).value.length, 1);
    assert.equal((await tool(keyA, "get_post", { id: postId })).value.id, postId);
    assert.equal((await tool(keyA, "publish_post", { id: postId })).value.status, "published");
    assert.ok((await tool(keyA, "get_post", { id: postId })).value.published_at);
    assert.equal((await tool(keyA, "unpublish_post", { id: postId })).value.status, "draft");

    const scheduled = await tool(keyA, "schedule_post", { id: postId, publish_at: new Date(Date.now() + 60_000).toISOString() });
    assert.equal(scheduled.value.status, "scheduled");
    assert.equal(postService.getPublishedPostBySlug(scheduled.value.slug as string), null);
    assert.equal((await tool(keyA, "schedule_post", { id: postId, publish_at: "not-a-date" })).isError, true);
    assert.equal((await tool(keyB, "get_post", { id: postId })).isError, true);
    assert.equal((await tool(keyB, "update_post", { id: postId, title: "Stolen" })).isError, true);
    assert.equal((await tool(keyB, "delete_post", { id: postId })).isError, true);
    analyticsService.recordEvent(postId, "view");
    assert.deepEqual((await tool(keyB, "get_analytics")).value, []);
    assert.deepEqual((await tool(keyA, "get_analytics")).value, [{ post_id: postId, event_count: 1 }]);
    assert.deepEqual((await tool(keyA, "delete_post", { id: postId })).value, { deleted: true });

    const unauthorized = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }) });
    assert.equal(unauthorized.status, 401);

    const invalidRequest = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${keyA}` },
      body: JSON.stringify({ jsonrpc: "1.0", id: 99, method: "tools/list" })
    });
    assert.equal(invalidRequest.status, 400);
    assert.equal((await invalidRequest.json() as { error: { code: number } }).error.code, -32600);

    const unknownMethod = await rpc(keyA, "resources/list");
    assert.equal((unknownMethod.body as { error?: { code: number } }).error?.code, -32601);
    assert.equal((await tool(keyA, "create_post", { title: "Missing content" })).isError, true);

    apiKeys.revokeKeyForUser(userA.id, keyARecord.id);
    const revoked = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${keyA}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 100, method: "tools/list" })
    });
    assert.equal(revoked.status, 401);
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    db.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
