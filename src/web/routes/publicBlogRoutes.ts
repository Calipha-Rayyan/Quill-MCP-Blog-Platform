import { Router } from "express";
import type { AnalyticsService } from "../../services/analyticsService.js";
import type { PostService } from "../../services/postService.js";

/** Read-only routes intentionally use only the public post-service methods. */
export function createPublicBlogRouter(postService: PostService, analyticsService: AnalyticsService): Router {
  const router = Router();
  router.get("/", (_req, res) => res.json({ posts: postService.listPublishedPosts() }));
  router.get("/:slug", (req, res) => {
    const post = postService.getPublishedPostBySlug(req.params.slug);
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    analyticsService.recordEvent(post.id, "view", req.get("referer") ?? null);
    res.json({ post });
  });
  return router;
}
