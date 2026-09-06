import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const message = error instanceof Error ? error.message : "Internal server error";
  const isValidationError = error instanceof Error && /required|invalid|future|already registered/i.test(message);
  res.status(isValidationError ? 400 : 500).json({ error: isValidationError ? message : "Internal server error" });
}
