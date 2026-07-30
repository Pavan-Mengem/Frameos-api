import {
  Table, Column, Model, PrimaryKey, AutoIncrement, Default, AllowNull, ForeignKey, BelongsTo, HasMany,
  DataType, CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Client } from '../../clients/models/clientModel';
import { Event } from '../../events/models/eventModel';
import { Studio } from '../../studios/models/studioModel';
import { QuotationLineItem } from './quotationLineItemModel';

export const QUOTATION_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export interface QuotationAttributes {
  id: number;
  studioId: string;
  clientId: number;
  eventId: number | null;
  quoteNumber: string; // Q-2526-000001
  status: QuotationStatus;
  placeOfSupply: string | null; // 2-digit state code
  studioGstinSnapshot: string | null; // frozen at creation
  currency: string;
  subtotalInr: number;
  discountInr: number;
  taxableInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalInr: number;
  notes: string | null;
  terms: string | null;
  validUntil: Date | null;
  shareSlug: string | null; // opaque public view token
  sentAt: Date | null;
  acceptedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface QuotationCreationAttributes
  extends Optional<QuotationAttributes,
    'id' | 'eventId' | 'status' | 'placeOfSupply' | 'studioGstinSnapshot' | 'currency' |
    'discountInr' | 'cgstInr' | 'sgstInr' | 'igstInr' | 'notes' | 'terms' | 'validUntil' |
    'shareSlug' | 'sentAt' | 'acceptedAt' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

@Table({
  tableName: 'quotations',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['studio_id'] },
    { fields: ['studio_id', 'status'] },
    { fields: ['studio_id', 'client_id'] },
    { unique: true, fields: ['studio_id', 'quote_number'] },
    { unique: true, fields: ['share_slug'] }, // Postgres unique treats NULLs as distinct → safe
  ],
})
export class Quotation extends Model<QuotationAttributes, QuotationCreationAttributes> implements QuotationAttributes {
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

  @ForeignKey(() => Client)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare clientId: number;

  @BelongsTo(() => Client, { foreignKey: 'clientId', as: 'client' })
  declare client?: Client;

  @ForeignKey(() => Event)
  @Column(DataType.INTEGER)
  declare eventId: number | null;

  @BelongsTo(() => Event, { foreignKey: 'eventId', as: 'event' })
  declare event?: Event;

  @AllowNull(false)
  @Column(DataType.STRING(30))
  declare quoteNumber: string;

  @AllowNull(false)
  @Default('draft')
  @Column(DataType.ENUM(...QUOTATION_STATUSES))
  declare status: QuotationStatus;

  @Column(DataType.STRING(2))
  declare placeOfSupply: string | null;

  @Column(DataType.STRING(15))
  declare studioGstinSnapshot: string | null;

  @AllowNull(false)
  @Default('INR')
  @Column(DataType.STRING(3))
  declare currency: string;

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

  @Column(DataType.TEXT)
  declare notes: string | null;

  @Column(DataType.TEXT)
  declare terms: string | null;

  @Column(DataType.DATEONLY)
  declare validUntil: Date | null;

  @Column(DataType.STRING(40))
  declare shareSlug: string | null;

  @Column(DataType.DATE)
  declare sentAt: Date | null;

  @Column(DataType.DATE)
  declare acceptedAt: Date | null;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;

  @HasMany(() => QuotationLineItem, { foreignKey: 'quotationId', as: 'lines' })
  declare lines?: QuotationLineItem[];
}
