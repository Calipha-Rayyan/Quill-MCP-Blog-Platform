import type { Database } from "../database.js";
import type { Post, PostStatus } from "../../types/post.js";

export class PostRepository {
  constructor(private readonly db: Database) {}

  create(post: Post): void {
    this.db.prepare(`
      INSERT INTO posts (
        id, user_id, title, slug, content_md, status,
        meta_title, meta_description, published_at, scheduled_at,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      post.id, post.user_id, post.title, post.slug, post.content_md, post.status,
      post.meta_title, post.meta_description, post.published_at, post.scheduled_at,
      post.created_at, post.updated_at
    );
  }

  findByIdForUser(id: string, userId: string): Post | null {
    return (this.db.prepare(
      "SELECT * FROM posts WHERE id = ? AND user_id = ?"
    ).get(id, userId) as Post | undefined) ?? null;
  }

  listForUser(userId: string, status?: PostStatus, limit = 50): Post[] {
    const safeLimit = Math.max(1, Math.min(limit, 100));
    if (status) {
      return this.db.prepare(`
        SELECT * FROM posts
        WHERE user_id = ? AND status = ?
        ORDER BY updated_at DESC
        LIMIT ?
      `).all(userId, status, safeLimit) as Post[];
    }

    return this.db.prepare(`
      SELECT * FROM posts
      WHERE user_id = ?
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(userId, safeLimit) as Post[];
  }

  listPublished(): Post[] {
    return this.db.prepare(`
      SELECT * FROM posts
      WHERE status = 'published'
      ORDER BY published_at DESC
    `).all() as Post[];
  }

  findPublishedBySlug(slug: string): Post | null {
    return (this.db.prepare(`
      SELECT * FROM posts
      WHERE slug = ? AND status = 'published'
      LIMIT 1
    `).get(slug) as Post | undefined) ?? null;
  }

  update(
    id: string,
    userId: string,
    patch: Partial<Pick<Post, "title" | "slug" | "content_md" | "status" | "meta_title" | "meta_description" | "published_at" | "scheduled_at">>
  ): boolean {
    const entries = Object.entries(patch).filter(([, value]) => value !== undefined);
    if (entries.length === 0) return false;

    const fields = entries.map(([field]) => `${field} = ?`).join(", ");
    const values = entries.map(([, value]) => value);

    const result = this.db.prepare(`
      UPDATE posts
      SET ${fields}, updated_at = ?
      WHERE id = ? AND user_id = ?
    `).run(...values, new Date().toISOString(), id, userId);

    return Number(result.changes) > 0;
  }

  delete(id: string, userId: string): boolean {
    const result = this.db.prepare(
      "DELETE FROM posts WHERE id = ? AND user_id = ?"
    ).run(id, userId);
    return Number(result.changes) > 0;
  }
}
