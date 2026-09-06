import type { Request, Response, NextFunction } from "express";

export interface SessionRequest extends Request {
  userId?: string;
}

// Dashboard session implementation will be completed on feature/dashboard.
export function sessionAuth(_req: Request, _res: Response, next: NextFunction): void {
  next();
}
