import "dotenv/config";
import express from "express";

import { createDatabase } from "./db/database.js";
import { runMigrations } from "./db/migrations/index.js";

import { UserRepository } from "./db/repositories/userRepository.js";
import { ApiKeyRepository } from "./db/repositories/apiKeyRepository.js";
import { PostRepository } from "./db/repositories/postRepository.js";
import { AnalyticsRepository } from "./db/repositories/analyticsRepository.js";

import { AuthService } from "./services/authService.js";
import { ApiKeyService } from "./services/apiKeyService.js";
import { PostService } from "./services/postService.js";
import { AnalyticsService } from "./services/analyticsService.js";
import { OAuthService } from "./services/oauthService.js";

import { errorHandler } from "./api/middleware/errorHandler.js";
import { sessionAuth } from "./api/middleware/sessionAuth.js";

import { createAuthRouter } from "./api/routes/authRoutes.js";
import { createPostRouter } from "./api/routes/postRoutes.js";
import { createAccountRouter } from "./api/routes/accountRoutes.js";
import { createAnalyticsRouter } from "./api/routes/analyticsRoutes.js";
import { createOAuthRouter } from "./api/routes/oauthRoutes.js";

import { createPublicBlogRouter } from "./web/routes/publicBlogRoutes.js";
import { createMcpRouter } from "./mcp/server.js";

import { logger } from "./utils/logger.js";

const port = Number(process.env.PORT ?? 3000);
const databasePath =
  process.env.DATABASE_PATH ?? "./data/quill.db";

/*
 * Database
 */
export const db = createDatabase(databasePath);

runMigrations(db);

/*
 * Repositories
 */
const userRepository = new UserRepository(db);
const apiKeyRepository = new ApiKeyRepository(db);
const postRepository = new PostRepository(db);
const analyticsRepository =
  new AnalyticsRepository(db);

/*
 * Shared application services
 */
export const services = {
  authService: new AuthService(userRepository),

  apiKeyService:
    new ApiKeyService(apiKeyRepository),

  postService:
    new PostService(postRepository),

  analyticsService:
    new AnalyticsService(analyticsRepository),
};

/*
 * OAuth service
 *
 * This is kept separate from the existing
 * API-key and dashboard session systems.
 */
export const oauthService =
  new OAuthService();

/*
 * Express application
 */
export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/*
 * Environment validation
 */
const sessionSecret =
  process.env.SESSION_SECRET;

if (
  !sessionSecret ||
  sessionSecret ===
    "change-this-to-a-long-random-secret"
) {
  throw new Error(
    "SESSION_SECRET must be set to a strong, non-default value",
  );
}

/*
 * Health check
 */
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

/*
 * OAuth / MCP authorization endpoints
 *
 * These must remain public because Claude needs
 * to discover the authorization server and complete
 * the OAuth login flow.
 */
app.use(
  createOAuthRouter(
    services.authService,
    oauthService,
  ),
);

/*
 * Authentication
 */
app.use(
  "/api/auth",
  createAuthRouter(
    services.authService,
    sessionSecret,
  ),
);

/*
 * Protected dashboard APIs
 */
app.use(
  "/api/posts",
  sessionAuth(
    services.authService,
    sessionSecret,
  ),
  createPostRouter(
    services.postService,
  ),
);

app.use(
  "/api/account",
  sessionAuth(
    services.authService,
    sessionSecret,
  ),
  createAccountRouter(
    services.apiKeyService,
  ),
);

app.use(
  "/api/analytics",
  sessionAuth(
    services.authService,
    sessionSecret,
  ),
  createAnalyticsRouter(
    services.analyticsService,
  ),
);

/*
 * Public blog
 */
app.use(
  "/blog",
  createPublicBlogRouter(
    services.postService,
    services.analyticsService,
  ),
);

/*
 * MCP
 *
 * Existing MCP API-key authentication remains
 * in place for now.
 */
app.use(
  process.env.MCP_BASE_PATH ?? "/mcp",
  createMcpRouter({
    ...services,
    oauthService,
  }),
);

/*
 * Global error handler
 */
app.use(errorHandler);

/*
 * Start server
 */
if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    logger.info(
      `Quill server running on port ${port}`,
    );

    logger.info(
      `SQLite database: ${databasePath}`,
    );
  });
}

export default app;