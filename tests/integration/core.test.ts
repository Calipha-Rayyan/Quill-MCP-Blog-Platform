import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDatabase } from "../../src/db/database.js";
import { runMigrations } from "../../src/db/migrations/index.js";
import { PostRepository } from "../../src/db/repositories/postRepository.js";
import { PostService } from "../../src/services/postService.js";

test("post service creates and publishes a post", () => {
  const dir = mkdtempSync(join(tmpdir(), "quill-test-"));
  const db = createDatabase(join(dir, "test.db"));
  runMigrations(db);

  const service = new PostService(new PostRepository(db));
  const created = service.createPost("user-1", "Hello Quill", "# Hello");

  assert.equal(created.status, "draft");
  assert.equal(service.listPublishedPosts().length, 0);

  const published = service.publishPost("user-1", created.id);
  assert.equal(published?.status, "published");
  assert.equal(service.listPublishedPosts().length, 1);
  assert.equal(service.getPublishedPostBySlug(created.slug)?.id, created.id);

  db.close();
  rmSync(dir, { recursive: true, force: true });
});

test("users cannot access another user's post", () => {
  const dir = mkdtempSync(join(tmpdir(), "quill-test-"));
  const db = createDatabase(join(dir, "test.db"));
  runMigrations(db);

  const service = new PostService(new PostRepository(db));
  const created = service.createPost("user-a", "Private Post", "# Private");

  assert.equal(service.getPost("user-b", created.id), null);
  assert.equal(service.updatePost("user-b", created.id, { title: "Nope" }), null);
  assert.equal(service.deletePost("user-b", created.id), false);

  db.close();
  rmSync(dir, { recursive: true, force: true });
});
