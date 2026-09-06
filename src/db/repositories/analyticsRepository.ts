import type { Database } from "../database.js";
import type { AnalyticsEvent } from "../../types/analytics.js";

export class AnalyticsRepository {
  constructor(private readonly db: Database) {}

  create(event: AnalyticsEvent): void {
    this.db.prepare(`
      INSERT INTO analytics_events (id, post_id, event_type, referrer, occurred_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(event.id, event.post_id, event.event_type, event.referrer, event.occurred_at);
  }

  countByPostForUser(userId: string): Array<{ post_id: string; event_count: number }> {
    return this.db.prepare(`
      SELECT events.post_id, COUNT(*) AS event_count
      FROM analytics_events AS events
      INNER JOIN posts ON posts.id = events.post_id
      WHERE posts.user_id = ?
      GROUP BY events.post_id
    `).all(userId) as unknown as Array<{ post_id: string; event_count: number }>;
  }
}
