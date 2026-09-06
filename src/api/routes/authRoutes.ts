import { Router } from "express";
import type { AuthService } from "../../services/authService.js";

export function createAuthRouter(authService: AuthService, sessionSecret: string): Router {
  const router = Router();

  router.post("/signup", (req, res) => {
    const { email, password } = req.body as { email?: unknown; password?: unknown };
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const user = authService.registerUser(email, password);
    const token = authService.createSession(user.id, sessionSecret);
    res.status(201).json({ user: { id: user.id, email: user.email, created_at: user.created_at }, token });
  });

  router.post("/login", (req, res) => {
    const { email, password } = req.body as { email?: unknown; password?: unknown };
    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const user = authService.verifyPassword(email, password);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    res.json({ user: { id: user.id, email: user.email, created_at: user.created_at }, token: authService.createSession(user.id, sessionSecret) });
  });

  return router;
}
