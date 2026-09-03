// Shared Post type -- matches the "Posts -- Exact Shared Contract" section
// of the Quill Common Backend & Database Structure document.
// This is Member 2's local reference copy. The authoritative version
// will live in src/types/ once the Team Leader pushes feature/core-db.

export type PostStatus = "draft" | "published" | "scheduled";

export interface Post {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content_md: string;
  status: PostStatus;
  meta_title?: string;
  meta_description?: string;
  published_at?: string | null;
  scheduled_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  title: string;
  content_md: string;
  status?: PostStatus;
  meta_title?: string;
  meta_description?: string;
  scheduled_at?: string;
}