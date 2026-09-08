import { randomUUID } from "node:crypto";
import type { AnalyticsRepository } from "../db/repositories/analyticsRepository.js";

export class AnalyticsService {
  constructor(private readonly analytics: AnalyticsRepository) {}

  recordEvent(
    postId: string,
    eventType: string,
    referrer: string | null = null,
  ): void {
    this.analytics.create({
      id: randomUUID(),
      post_id: postId,
      event_type: eventType,
      referrer,
      occurred_at: new Date().toISOString(),
    });
  }

  getAnalytics(
    userId: string,
  ): Array<{ post_id: string; event_count: number }> {
    return this.analytics.countByPostForUser(userId);
  }
}