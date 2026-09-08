import type { Request, Response, NextFunction } from "express";
import type { AuthService } from "../../services/authService.js";

export interface SessionRequest extends Request {
  userId?: string;
}

export function sessionAuth(
  authService: AuthService,
  sessionSecret: string,
) {
  return (
    req: SessionRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    const authorization = req.header("Authorization");
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    const userId = token
      ? authService.getSessionUserId(token, sessionSecret)
      : null;

    if (!userId) {
      res.status(401).json({
        error: "Authentication required",
      });
      return;
    }

    req.userId = userId;
    next();
  };
}