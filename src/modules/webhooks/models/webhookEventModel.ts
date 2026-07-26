import {
  Table, Column, Model, PrimaryKey, Default, AllowNull,
  DataType, CreatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';

export interface WebhookEventAttributes {
  id: string;
  provider: string;    // 'razorpay' | ...
  eventId: string;     // provider's event id
  eventType: string;   // 'payment.captured', ...
  payloadHash: string; // sha256 of raw body
  processedAt?: Date;
  createdAt?: Date;
}

export interface WebhookEventCreationAttributes
  extends Optional<WebhookEventAttributes, 'id' | 'processedAt' | 'createdAt'> {}

/**
 * Idempotency ledger for provider webhooks (Razorpay, future OTPless, etc.).
 * If a webhook fires twice, we keep exactly one row and every handler is a
 * no-op after the first successful processing. Not studio-scoped: some
 * events arrive before we've resolved the tenant.
 */
@Table({
  tableName: 'webhook_events',
  timestamps: true,
  paranoid: false,
  updatedAt: false,
  indexes: [{ unique: true, fields: ['provider', 'event_id'] }],
})
export class WebhookEvent extends Model<WebhookEventAttributes, WebhookEventCreationAttributes> implements WebhookEventAttributes {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare provider: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare eventId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare eventType: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare payloadHash: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare processedAt: Date;

  @CreatedAt declare createdAt: Date;
}
