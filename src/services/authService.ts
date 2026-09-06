import { createHmac, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { UserRepository } from "../db/repositories/userRepository.js";
import type { User } from "../types/user.js";
import { assertEmail, assertNonEmpty } from "../utils/validation.js";

function hashPassword(password: string): string {
  const salt = randomUUID();
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, storedHash] = stored.split(":");
  if (!salt || !storedHash) return false;
  const derived = scryptSync(password, salt, 64);
  const expected = Buffer.from(storedHash, "hex");
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  registerUser(email: string, password: string): User {
    assertEmail(email);
    assertNonEmpty(password, "password");
    if (this.users.findByEmail(email.trim().toLowerCase())) {
      throw new Error("Email already registered");
    }

    const user: User = {
      id: randomUUID(),
      email: email.trim().toLowerCase(),
      password_hash: hashPassword(password),
      created_at: new Date().toISOString()
    };
    this.users.create(user);
    return user;
  }

  verifyPassword(email: string, password: string): User | null {
    const user = this.users.findByEmail(email.trim().toLowerCase());
    return user && verifyPassword(password, user.password_hash) ? user : null;
  }

  createSession(userId: string, secret: string, ttlSeconds = 60 * 60 * 24 * 7): string {
    const payload = Buffer.from(JSON.stringify({ userId, exp: Math.floor(Date.now() / 1000) + ttlSeconds }))
      .toString("base64url");
    const signature = createHmac("sha256", secret).update(payload).digest("base64url");
    return `${payload}.${signature}`;
  }

  getSessionUserId(token: string, secret: string): string | null {
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;
    const expected = createHmac("sha256", secret).update(payload).digest("base64url");
    const actual = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actual.length !== expectedBuffer.length || !timingSafeEqual(actual, expectedBuffer)) return null;
    try {
      const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
        userId?: unknown; exp?: unknown;
      };
      return typeof session.userId === "string" && typeof session.exp === "number"
        && session.exp > Math.floor(Date.now() / 1000) ? session.userId : null;
    } catch {
      return null;
    }
  }
}
