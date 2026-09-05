// Mock Post Service -- TEMPORARY
// -----------------------------------------------------------------------
// The real postService (owned by the Team Leader on feature/core-db) does
// not exist yet. This mock matches the expected contract from section 7
// ("Shared Service Layer") of the team document so that MCP tools can be
// built and demoed now, and swapped over to the real service later with
// minimal changes.
//
// DELETE THIS FILE once src/services/postService.ts lands on dev.
// -----------------------------------------------------------------------

import type { Post, PostStatus, CreatePostInput } from "../types/post.js";

// In-memory store, keyed by post id. Resets every time the server restarts.
const posts = new Map<string, Post>();

let nextId = 1;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function createPost(userId: string, input: CreatePostInput): Post {
  const now = new Date().toISOString();
  const status: PostStatus = input.status ?? "draft";

  const post: Post = {
    id: String(nextId++),
    user_id: userId,
    title: input.title,
    slug: slugify(input.title),
    content_md: input.content_md,
    status,
    meta_title: input.meta_title,
    meta_description: input.meta_description,
    published_at: status === "published" ? now : null,
    scheduled_at: input.scheduled_at ?? null,
    created_at: now,
    updated_at: now,
  };

  posts.set(post.id, post);
  return post;
}

export function getPost(userId: string, postId: string): Post | undefined {
  const post = posts.get(postId);
  if (!post || post.user_id !== userId) return undefined;
  return post;
}

export function listPosts(userId: string): Post[] {
  return Array.from(posts.values()).filter((p) => p.user_id === userId);
}

export function publishPost(userId: string, postId: string): Post | undefined {
  const post = getPost(userId, postId);
  if (!post) return undefined;

  post.status = "published";
  post.published_at = new Date().toISOString();
  post.updated_at = post.published_at;
  posts.set(post.id, post);
  return post;
}