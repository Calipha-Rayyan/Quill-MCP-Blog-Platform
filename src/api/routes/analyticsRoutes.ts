import { Router } from "express";
import type { AnalyticsService } from "../../services/analyticsService.js";
import type { SessionRequest } from "../middleware/sessionAuth.js";

export function createAnalyticsRouter(analyticsService: AnalyticsService): Router {
  const router = Router();
  router.get("/", (req: SessionRequest, res) => res.json({ analytics: analyticsService.getAnalytics(req.userId!) }));
  return router;
}
