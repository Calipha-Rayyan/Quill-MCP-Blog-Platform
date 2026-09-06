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
}
