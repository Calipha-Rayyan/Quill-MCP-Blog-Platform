import { Router } from "express";
import type { PostStatus } from "../../types/post.js";
import type { PostService } from "../../services/postService.js";
import type { SessionRequest } from "../middleware/sessionAuth.js";

const validStatuses = new Set<PostStatus>(["draft", "published", "scheduled"]);

export function createPostRouter(postService: PostService): Router {
  const router = Router();
  router.get("/", (req: SessionRequest, res) => {
    const status = typeof req.query.status === "string" && validStatuses.has(req.query.status as PostStatus)
      ? req.query.status as PostStatus : undefined;
    const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : undefined;
    res.json({ posts: postService.listPosts(req.userId!, status, limit) });
  });
  router.post("/", (req: SessionRequest, res) => {
    const { title, content_md } = req.body as { title?: unknown; content_md?: unknown };
    if (typeof title !== "string" || typeof content_md !== "string") {
      res.status(400).json({ error: "title and content_md are required" }); return;
    }
    res.status(201).json({ post: postService.createPost(req.userId!, title, content_md) });
  });
  router.get("/:id", (req: SessionRequest, res) => {
    const post = postService.getPost(req.userId!, String(req.params.id));
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    res.json({ post });
  });
  router.patch("/:id", (req: SessionRequest, res) => {
    const { title, slug, content_md, meta_title, meta_description } = req.body as Record<string, unknown>;
    const post = postService.updatePost(req.userId!, String(req.params.id), {
      ...(typeof title === "string" ? { title } : {}), ...(typeof slug === "string" ? { slug } : {}),
      ...(typeof content_md === "string" ? { content_md } : {}),
      ...(typeof meta_title === "string" || meta_title === null ? { meta_title } : {}),
      ...(typeof meta_description === "string" || meta_description === null ? { meta_description } : {})
    });
    if (!post) { res.status(404).json({ error: "Post not found" }); return; }
    res.json({ post });
  });
  router.delete("/:id", (req: SessionRequest, res) => {
    if (!postService.deletePost(req.userId!, String(req.params.id))) { res.status(404).json({ error: "Post not found" }); return; }
    res.status(204).end();
  });
  router.post("/:id/publish", (req: SessionRequest, res) => respondPost(res, postService.publishPost(req.userId!, String(req.params.id))));
  router.post("/:id/unpublish", (req: SessionRequest, res) => respondPost(res, postService.unpublishPost(req.userId!, String(req.params.id))));
  router.post("/:id/schedule", (req: SessionRequest, res) => {
    const { publish_at } = req.body as { publish_at?: unknown };
    if (typeof publish_at !== "string") { res.status(400).json({ error: "publish_at is required" }); return; }
    respondPost(res, postService.schedulePost(req.userId!, String(req.params.id), publish_at));
  });
  return router;
}

function respondPost(res: import("express").Response, post: ReturnType<PostService["getPost"]>): void {
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  res.json({ post });
}
