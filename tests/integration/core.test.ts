import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDatabase } from "../../src/db/database.js";
import { runMigrations } from "../../src/db/migrations/index.js";
import { PostRepository } from "../../src/db/repositories/postRepository.js";
import { ApiKeyRepository } from "../../src/db/repositories/apiKeyRepository.js";
import { UserRepository } from "../../src/db/repositories/userRepository.js";
import { ApiKeyService } from "../../src/services/apiKeyService.js";
import { AuthService } from "../../src/services/authService.js";
import { PostService } from "../../src/services/postService.js";

test("post service creates and publishes a post", () => {
  const dir = mkdtempSync(join(tmpdir(), "quill-test-"));
  const db = createDatabase(join(dir, "test.db"));
  runMigrations(db);

  const auth = new AuthService(new UserRepository(db));
  const user = auth.registerUser("reader@example.com", "secure password");
  const service = new PostService(new PostRepository(db));
  const created = service.createPost(user.id, "Hello Quill", "# Hello");

  assert.equal(created.status, "draft");
  assert.equal(service.listPublishedPosts().length, 0);

  const published = service.publishPost(user.id, created.id);
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

  const auth = new AuthService(new UserRepository(db));
  const firstUser = auth.registerUser("first@example.com", "secure password");
  const secondUser = auth.registerUser("second@example.com", "secure password");
  const service = new PostService(new PostRepository(db));
  const created = service.createPost(firstUser.id, "Private Post", "# Private");

  assert.equal(service.getPost(secondUser.id, created.id), null);
  assert.equal(service.updatePost(secondUser.id, created.id, { title: "Nope" }), null);
  assert.equal(service.deletePost(secondUser.id, created.id), false);

  db.close();
  rmSync(dir, { recursive: true, force: true });
});

test("scheduled and unpublished posts are never returned publicly", () => {
  const dir = mkdtempSync(join(tmpdir(), "quill-test-"));
  const db = createDatabase(join(dir, "test.db"));
  runMigrations(db);
  const auth = new AuthService(new UserRepository(db));
  const user = auth.registerUser("author@example.com", "secure password");
  const service = new PostService(new PostRepository(db));
  const post = service.createPost(user.id, "Scheduled post", "# Private");

  service.schedulePost(user.id, post.id, new Date(Date.now() + 60_000).toISOString());
  assert.equal(service.getPublishedPostBySlug(post.slug), null);
  assert.equal(service.listPublishedPosts().length, 0);
  service.publishPost(user.id, post.id);
  assert.equal(service.getPublishedPostBySlug(post.slug)?.id, post.id);
  service.unpublishPost(user.id, post.id);
  assert.equal(service.getPublishedPostBySlug(post.slug), null);

  db.close();
  rmSync(dir, { recursive: true, force: true });
});

test("sessions and API keys authenticate only their owning user", () => {
  const dir = mkdtempSync(join(tmpdir(), "quill-test-"));
  const db = createDatabase(join(dir, "test.db"));
  runMigrations(db);
  const auth = new AuthService(new UserRepository(db));
  const user = auth.registerUser("key-owner@example.com", "secure password");
  const otherUser = auth.registerUser("other-owner@example.com", "secure password");
  const secret = "test-secret";
  const session = auth.createSession(user.id, secret);
  assert.equal(auth.getSessionUserId(session, secret), user.id);
  assert.equal(auth.getSessionUserId(session, "wrong-secret"), null);

  const keys = new ApiKeyService(new ApiKeyRepository(db));
  const created = keys.createKey(user.id);
  assert.equal(keys.authenticateKey(created.key), user.id);
  assert.equal(keys.revokeKeyForUser(otherUser.id, created.id), false);
  assert.equal(keys.authenticateKey(created.key), user.id);
  assert.equal(keys.revokeKeyForUser(user.id, created.id), true);
  assert.equal(keys.authenticateKey(created.key), null);

  db.close();
  rmSync(dir, { recursive: true, force: true });
});
