export interface AnalyticsEvent {
  id: string;
  post_id: string;
  event_type: string;
  referrer: string | null;
  occurred_at: string;
}
