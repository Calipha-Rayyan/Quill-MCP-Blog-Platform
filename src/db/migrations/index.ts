import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { Database } from "../database.js";

export function runMigrations(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const directory = dirname(fileURLToPath(import.meta.url));
  const migrationFiles = readdirSync(directory)
    .filter((file) => /^\d+_.*\.sql$/.test(file))
    .sort();

  const hasMigration = db.prepare(
    "SELECT version FROM schema_migrations WHERE version = ?"
  );
  const insertMigration = db.prepare(
    "INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)"
  );

  for (const file of migrationFiles) {
    const version = file.split("_")[0];
    if (hasMigration.get(version)) continue;

    const sql = readFileSync(join(directory, file), "utf8");
    db.exec("BEGIN");
    try {
      db.exec(sql);
      insertMigration.run(version, new Date().toISOString());
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}
