import type { Request, Response, NextFunction } from "express";
import type { ApiKeyService } from "../../services/apiKeyService.js";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function apiKeyAuth(apiKeyService: ApiKeyService) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const raw = req.header("Authorization");
    const key = raw?.replace(/^Bearer\s+/i, "");

    if (!key) {
      res.status(401).json({ error: "Missing API key" });
      return;
    }

    const userId = apiKeyService.authenticateKey(key);
    if (!userId) {
      res.status(401).json({ error: "Invalid or revoked API key" });
      return;
    }

    req.userId = userId;
    next();
  };
}
