import {
  Table, Column, Model, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo, HasMany,
  DataType, CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Client } from '../../clients/models/clientModel';
import { Lead } from '../../leads/models/leadModel';
import { Studio } from '../../studios/models/studioModel';
import { TeamAssignment } from './teamAssignmentModel';
import { Quotation } from '../../quotations/models/quotationModel';
import { Payment } from '../../payments/models/paymentModel';
import { Invoice } from '../../payments/models/invoiceModel';
import { Gallery } from '../../galleries/models/galleryModel';

export const EVENT_STATUSES = ['upcoming', 'in_progress', 'delivered', 'cancelled'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface EventAttributes {
  id: string;
  studioId: string;
  clientId: string;
  leadId: string | null;
  title: string;
  eventType: string | null; // wedding | pre_wedding | event | portrait | other
  eventDate: Date;
  venue: string | null;
  totalInr: number; // in paise? -> keep rupees for simplicity across app
  advanceInr: number;
  paidInr: number; // denormalized; updated by payments module
  status: EventStatus;
  notes: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface EventCreationAttributes
  extends Optional<EventAttributes,
    'id' | 'leadId' | 'eventType' | 'venue' | 'totalInr' | 'advanceInr' | 'paidInr' |
    'status' | 'notes' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

@Table({
  tableName: 'events',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['studio_id'] },
    { fields: ['studio_id', 'status'] },
    { fields: ['studio_id', 'event_date'] },
    { fields: ['studio_id', 'client_id'] },
  ],
})
export class Event extends Model<EventAttributes, EventCreationAttributes> implements EventAttributes {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @ForeignKey(() => Studio)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare studioId: string;

  @BelongsTo(() => Studio, { foreignKey: 'studioId', as: 'studio' })
  declare studio?: Studio;

  @ForeignKey(() => Client)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare clientId: string;

  @BelongsTo(() => Client, { foreignKey: 'clientId', as: 'client' })
  declare client?: Client;

  @ForeignKey(() => Lead)
  @Column(DataType.UUID)
  declare leadId: string | null;

  @BelongsTo(() => Lead, { foreignKey: 'leadId', as: 'lead' })
  declare lead?: Lead;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare title: string;

  @Column(DataType.STRING)
  declare eventType: string | null;

  @AllowNull(false)
  @Column(DataType.DATEONLY)
  declare eventDate: Date;

  @Column(DataType.STRING)
  declare venue: string | null;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare totalInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare advanceInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare paidInr: number;

  @AllowNull(false)
  @Default('upcoming')
  @Column(DataType.ENUM(...EVENT_STATUSES))
  declare status: EventStatus;

  @Column(DataType.TEXT)
  declare notes: string | null;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;

  @HasMany(() => TeamAssignment, { foreignKey: 'eventId', as: 'team' })
  declare team?: TeamAssignment[];

  @HasMany(() => Quotation, { foreignKey: 'eventId', as: 'quotations' })
  declare quotations?: Quotation[];

  @HasMany(() => Payment, { foreignKey: 'eventId', as: 'payments' })
  declare payments?: Payment[];

  @HasMany(() => Invoice, { foreignKey: 'eventId', as: 'invoices' })
  declare invoices?: Invoice[];

  @HasMany(() => Gallery, { foreignKey: 'eventId', as: 'galleries' })
  declare galleries?: Gallery[];
}
