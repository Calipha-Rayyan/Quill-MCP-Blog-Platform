import { randomUUID } from "node:crypto";
import type { Post, PostStatus } from "../types/post.js";
import { PostRepository } from "../db/repositories/postRepository.js";
import { slugify } from "../utils/slug.js";
import { assertNonEmpty } from "../utils/validation.js";

export class PostService {
  constructor(private readonly posts: PostRepository) {}

  createPost(userId: string, title: string, contentMd: string): Post {
    assertNonEmpty(title, "title");
    assertNonEmpty(contentMd, "content");

    const now = new Date().toISOString();
    const post: Post = {
      id: randomUUID(),
      user_id: userId,
      title: title.trim(),
      slug: slugify(title) || randomUUID(),
      content_md: contentMd,
      status: "draft",
      meta_title: null,
      meta_description: null,
      published_at: null,
      scheduled_at: null,
      created_at: now,
      updated_at: now
    };

    this.posts.create(post);
    return post;
  }

  getPost(userId: string, id: string): Post | null {
    return this.posts.findByIdForUser(id, userId);
  }

  listPosts(userId: string, status?: PostStatus, limit = 50): Post[] {
    return this.posts.listForUser(userId, status, limit);
  }

  updatePost(
    userId: string,
    id: string,
    patch: Partial<Pick<Post, "title" | "content_md" | "slug" | "meta_title" | "meta_description">>
  ): Post | null {
    if (patch.title !== undefined) assertNonEmpty(patch.title, "title");
    if (patch.content_md !== undefined) assertNonEmpty(patch.content_md, "content");
    if (!this.posts.update(id, userId, patch)) return null;
    return this.posts.findByIdForUser(id, userId);
  }

  deletePost(userId: string, id: string): boolean {
    return this.posts.delete(id, userId);
  }

  publishPost(userId: string, id: string): Post | null {
    if (!this.posts.findByIdForUser(id, userId)) return null;
    this.posts.update(id, userId, {
      status: "published",
      published_at: new Date().toISOString(),
      scheduled_at: null
    });
    return this.posts.findByIdForUser(id, userId);
  }

  schedulePost(userId: string, id: string, publishAt: string): Post | null {
    const scheduledAt = new Date(publishAt);
    if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
      throw new Error("publishAt must be a future ISO-8601 date");
    }
    if (!this.posts.findByIdForUser(id, userId)) return null;
    this.posts.update(id, userId, {
      status: "scheduled",
      published_at: null,
      scheduled_at: scheduledAt.toISOString()
    });
    return this.posts.findByIdForUser(id, userId);
  }

  unpublishPost(userId: string, id: string): Post | null {
    if (!this.posts.findByIdForUser(id, userId)) return null;
    this.posts.update(id, userId, { status: "draft", published_at: null, scheduled_at: null });
    return this.posts.findByIdForUser(id, userId);
  }

  listPublishedPosts(): Post[] {
    this.publishDuePosts();
    return this.posts.listPublished();
  }

  getPublishedPostBySlug(slug: string): Post | null {
    this.publishDuePosts();
    return this.posts.findPublishedBySlug(slug);
  }

  publishDuePosts(): number {
    return this.posts.publishScheduledDue(new Date().toISOString());
  }
}
