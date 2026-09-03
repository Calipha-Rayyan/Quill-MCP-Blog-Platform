export type PostStatus = "draft" | "published" | "scheduled";

export interface Post {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content_md: string;
  status: PostStatus;
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}
