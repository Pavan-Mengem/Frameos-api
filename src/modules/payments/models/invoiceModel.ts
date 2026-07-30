import {
  Table, Column, Model, PrimaryKey, AutoIncrement, Default, AllowNull, ForeignKey, BelongsTo,
  DataType, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Studio } from '../../studios/models/studioModel';
import { Event } from '../../events/models/eventModel';
import { Payment } from './paymentModel';

export interface InvoiceAttributes {
  id: number;
  studioId: string;
  eventId: number;
  paymentId: number;
  invoiceNumber: string; // INV-2526-000001
  issuedAt: Date;
  placeOfSupply: string | null;
  studioGstinSnapshot: string | null;
  subtotalInr: number;
  discountInr: number;
  taxableInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalInr: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface InvoiceCreationAttributes
  extends Optional<InvoiceAttributes,
    'id' | 'issuedAt' | 'placeOfSupply' | 'studioGstinSnapshot' | 'discountInr' |
    'cgstInr' | 'sgstInr' | 'igstInr' | 'createdAt' | 'updatedAt'
  > {}

/** Emitted when a payment is captured. GST fields snapshotted at issue time. */
@Table({
  tableName: 'invoices',
  timestamps: true,
  paranoid: false,
  indexes: [
    { fields: ['studio_id'] },
    { fields: ['studio_id', 'event_id'] },
    { unique: true, fields: ['studio_id', 'invoice_number'] },
    { unique: true, fields: ['payment_id'] }, // one invoice per payment
  ],
})
export class Invoice extends Model<InvoiceAttributes, InvoiceCreationAttributes> implements InvoiceAttributes {
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

  @ForeignKey(() => Payment)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare paymentId: number;

  @BelongsTo(() => Payment, { foreignKey: 'paymentId', as: 'payment' })
  declare payment?: Payment;

  @AllowNull(false)
  @Column(DataType.STRING(30))
  declare invoiceNumber: string;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare issuedAt: Date;

  @Column(DataType.STRING(2))
  declare placeOfSupply: string | null;

  @Column(DataType.STRING(15))
  declare studioGstinSnapshot: string | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare subtotalInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare discountInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare taxableInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare cgstInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare sgstInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare igstInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare totalInr: number;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}
