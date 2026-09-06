import type { Database } from "../database.js";
import type { User } from "../../types/user.js";

export class UserRepository {
  constructor(private readonly db: Database) {}

  create(user: User): void {
    this.db.prepare(`
      INSERT INTO users (id, email, password_hash, created_at)
      VALUES (?, ?, ?, ?)
    `).run(user.id, user.email, user.password_hash, user.created_at);
  }

  findById(id: string): User | null {
    return (this.db.prepare("SELECT * FROM users WHERE id = ?").get(id) as User | undefined) ?? null;
  }

  findByEmail(email: string): User | null {
    return (this.db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined) ?? null;
  }
}
