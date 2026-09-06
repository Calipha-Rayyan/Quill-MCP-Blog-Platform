import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { ApiKeyRepository } from "../db/repositories/apiKeyRepository.js";

const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

export class ApiKeyService {
  constructor(private readonly apiKeys: ApiKeyRepository) {}

  createKey(userId: string): { id: string; key: string } {
    const key = `qk_${randomBytes(32).toString("hex")}`;
    const id = randomUUID();
    this.apiKeys.create({
      id,
      user_id: userId,
      key_hash: hashKey(key),
      created_at: new Date().toISOString(),
      revoked_at: null
    });
    return { id, key };
  }

  authenticateKey(key: string): string | null {
    return this.apiKeys.findActiveByHash(hashKey(key))?.user_id ?? null;
  }

  revokeKey(id: string): void {
    this.apiKeys.revoke(id, new Date().toISOString());
  }

  revokeKeyForUser(userId: string, id: string): boolean {
    return this.apiKeys.revokeForUser(id, userId, new Date().toISOString());
  }

  rotateKey(userId: string, id: string): { id: string; key: string } | null {
    if (!this.revokeKeyForUser(userId, id)) return null;
    return this.createKey(userId);
  }

  listKeys(userId: string) {
    return this.apiKeys.listForUser(userId);
  }
}
