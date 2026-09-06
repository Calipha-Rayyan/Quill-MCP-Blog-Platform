import type { Database } from "../database.js";

export interface ApiKeyRecord {
  id: string;
  user_id: string;
  key_hash: string;
  created_at: string;
  revoked_at: string | null;
}

export class ApiKeyRepository {
  constructor(private readonly db: Database) {}

  create(record: ApiKeyRecord): void {
    this.db.prepare(`
      INSERT INTO api_keys (id, user_id, key_hash, created_at, revoked_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(record.id, record.user_id, record.key_hash, record.created_at, record.revoked_at);
  }

  findActiveByHash(keyHash: string): ApiKeyRecord | null {
    return (this.db.prepare(`
      SELECT * FROM api_keys
      WHERE key_hash = ? AND revoked_at IS NULL
    `).get(keyHash) as ApiKeyRecord | undefined) ?? null;
  }

  revoke(id: string, revokedAt: string): void {
    this.db.prepare("UPDATE api_keys SET revoked_at = ? WHERE id = ?").run(revokedAt, id);
  }

  revokeForUser(id: string, userId: string, revokedAt: string): boolean {
    const result = this.db.prepare(
      "UPDATE api_keys SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL"
    ).run(revokedAt, id, userId);
    return Number(result.changes) > 0;
  }

  listForUser(userId: string): Omit<ApiKeyRecord, "key_hash">[] {
    return this.db.prepare(`
      SELECT id, user_id, created_at, revoked_at
      FROM api_keys
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId) as unknown as Omit<ApiKeyRecord, "key_hash">[];
  }
}
