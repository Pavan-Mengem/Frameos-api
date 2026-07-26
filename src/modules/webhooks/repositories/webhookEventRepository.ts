import { UniqueConstraintError } from 'sequelize';
import { WebhookEvent } from '../models/webhookEventModel';

/**
 * Record a webhook once. Returns true if this is the first time we've seen it
 * (caller should process); false if we've processed it before (caller should
 * ack without side-effects). Uses the unique (provider, event_id) index as the
 * atomic dedupe primitive — no read-then-write race.
 */
export class WebhookEventRepository {
  static async recordIfNew(data: {
    provider: string;
    eventId: string;
    eventType: string;
    payloadHash: string;
  }): Promise<boolean> {
    try {
      await WebhookEvent.create(data);
      return true;
    } catch (err) {
      if (err instanceof UniqueConstraintError) return false;
      throw err;
    }
  }
}
