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
import { errorHandler } from "./api/middleware/errorHandler.js";
import { logger } from "./utils/logger.js";

const port = Number(process.env.PORT ?? 3000);
const databasePath = process.env.DATABASE_PATH ?? "./data/quill.db";

const db = createDatabase(databasePath);
runMigrations(db);

const userRepository = new UserRepository(db);
const apiKeyRepository = new ApiKeyRepository(db);
const postRepository = new PostRepository(db);
const analyticsRepository = new AnalyticsRepository(db);

export const services = {
  authService: new AuthService(userRepository),
  apiKeyService: new ApiKeyService(apiKeyRepository),
  postService: new PostService(postRepository),
  analyticsService: new AnalyticsService(analyticsRepository)
};

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Quill server running on port ${port}`);
  logger.info(`SQLite database: ${databasePath}`);
});

export default app;
