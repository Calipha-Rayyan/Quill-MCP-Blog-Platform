import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
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
}
