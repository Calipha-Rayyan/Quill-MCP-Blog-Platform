import { Router } from "express";
import type { ApiKeyService } from "../../services/apiKeyService.js";
import type { SessionRequest } from "../middleware/sessionAuth.js";

export function createAccountRouter(apiKeyService: ApiKeyService): Router {
  const router = Router();
  router.get("/api-keys", (req: SessionRequest, res) => res.json({ api_keys: apiKeyService.listKeys(req.userId!) }));
  router.post("/api-keys", (req: SessionRequest, res) => res.status(201).json({ api_key: apiKeyService.createKey(req.userId!) }));
  router.post("/api-keys/:id/rotate", (req: SessionRequest, res) => {
    const apiKey = apiKeyService.rotateKey(req.userId!, String(req.params.id));
    if (!apiKey) { res.status(404).json({ error: "API key not found" }); return; }
    res.json({ api_key: apiKey });
  });
  router.delete("/api-keys/:id", (req: SessionRequest, res) => {
    if (!apiKeyService.revokeKeyForUser(req.userId!, String(req.params.id))) { res.status(404).json({ error: "API key not found" }); return; }
    res.status(204).end();
  });
  return router;
}
