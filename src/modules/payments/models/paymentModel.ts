import {
  Table, Column, Model, PrimaryKey, AutoIncrement, Default, AllowNull, ForeignKey, BelongsTo, HasOne,
  DataType, CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Studio } from '../../studios/models/studioModel';
import { Event } from '../../events/models/eventModel';
import { Invoice } from './invoiceModel';

export const PAYMENT_GATEWAYS = ['razorpay', 'manual'] as const;
export type PaymentGateway = (typeof PAYMENT_GATEWAYS)[number];

export const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'emi', 'wallet', 'cash', 'other'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_KINDS = ['advance', 'balance', 'manual'] as const;
export type PaymentKind = (typeof PAYMENT_KINDS)[number];

export const PAYMENT_STATUSES = ['created', 'paid', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface PaymentAttributes {
  id: number;
  studioId: string;
  eventId: number;
  kind: PaymentKind;
  amountInr: number; // integer ₹ (paise-safe on Razorpay boundary)
  currency: string;
  gateway: PaymentGateway;
  gatewayOrderId: string | null; // razorpay order_id
  gatewayPaymentId: string | null; // razorpay payment_id
  method: PaymentMethod | null;
  status: PaymentStatus;
  capturedAt: Date | null;
  notes: string | null;
  invoiceId: number | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface PaymentCreationAttributes
  extends Optional<PaymentAttributes,
    'id' | 'currency' | 'gatewayOrderId' | 'gatewayPaymentId' | 'method' | 'status' |
    'capturedAt' | 'notes' | 'invoiceId' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

@Table({
  tableName: 'payments',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['studio_id'] },
    { fields: ['studio_id', 'event_id'] },
    { fields: ['studio_id', 'status'] },
    { unique: true, fields: ['gateway_order_id'] }, // one Payment per order; NULLs distinct
    { unique: true, fields: ['gateway_payment_id'] },
  ],
})
export class Payment extends Model<PaymentAttributes, PaymentCreationAttributes> implements PaymentAttributes {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Studio)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare studioId: string;

  @BelongsTo(() => Studio, { foreignKey: 'studioId', as: 'studio' })
  declare studio?: Studio;

  @ForeignKey(() => Event)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare eventId: number;

  @BelongsTo(() => Event, { foreignKey: 'eventId', as: 'event' })
  declare event?: Event;

  @AllowNull(false)
  @Column(DataType.ENUM(...PAYMENT_KINDS))
  declare kind: PaymentKind;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare amountInr: number;

  @AllowNull(false)
  @Default('INR')
  @Column(DataType.STRING(3))
  declare currency: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...PAYMENT_GATEWAYS))
  declare gateway: PaymentGateway;

  @Column(DataType.STRING)
  declare gatewayOrderId: string | null;

  @Column(DataType.STRING)
  declare gatewayPaymentId: string | null;

  @Column(DataType.ENUM(...PAYMENT_METHODS))
  declare method: PaymentMethod | null;

  @AllowNull(false)
  @Default('created')
  @Column(DataType.ENUM(...PAYMENT_STATUSES))
  declare status: PaymentStatus;

  @Column(DataType.DATE)
  declare capturedAt: Date | null;

  @Column(DataType.TEXT)
  declare notes: string | null;

  @Column(DataType.INTEGER)
  declare invoiceId: number | null;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;

  @HasOne(() => Invoice, { foreignKey: 'paymentId', as: 'invoice' })
  declare invoice?: Invoice;
}
