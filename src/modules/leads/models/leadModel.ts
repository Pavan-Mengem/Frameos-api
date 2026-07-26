import {
  Table, Column, Model, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo, HasOne,
  DataType, CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Client } from '../../clients/models/clientModel';
import { Event } from '../../events/models/eventModel';
import { Studio } from '../../studios/models/studioModel';
import { User } from '../../users/models/userModel';

export const LEAD_SOURCES = ['portfolio', 'whatsapp', 'referral', 'instagram', 'walk_in', 'other'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadAttributes {
  id: string;
  studioId: string;
  clientId: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  eventType: string | null; // wedding | pre_wedding | event | portrait | other
  eventDate: Date | null;
  venue: string | null;
  budgetInr: number | null;
  source: LeadSource;
  status: LeadStatus;
  assignedTo: string | null; // users.id
  notes: string | null;
  followUpAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface LeadCreationAttributes
  extends Optional<LeadAttributes,
    'id' | 'clientId' | 'phone' | 'email' | 'eventType' | 'eventDate' | 'venue' | 'budgetInr' |
    'source' | 'status' | 'assignedTo' | 'notes' | 'followUpAt' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

@Table({
  tableName: 'leads',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['studio_id'] },
    { fields: ['studio_id', 'status'] },
    { fields: ['studio_id', 'event_date'] },
    { fields: ['studio_id', 'assigned_to'] },
    { fields: ['studio_id', 'follow_up_at'] },
  ],
})
export class Lead extends Model<LeadAttributes, LeadCreationAttributes> implements LeadAttributes {
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
  @Column(DataType.UUID)
  declare clientId: string | null;

  @BelongsTo(() => Client, { foreignKey: 'clientId', as: 'client' })
  declare client?: Client;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare phone: string | null;

  @Column(DataType.STRING)
  declare email: string | null;

  @Column(DataType.STRING)
  declare eventType: string | null;

  @Column(DataType.DATEONLY)
  declare eventDate: Date | null;

  @Column(DataType.STRING)
  declare venue: string | null;

  @Column(DataType.INTEGER)
  declare budgetInr: number | null;

  @AllowNull(false)
  @Default('other')
  @Column(DataType.ENUM(...LEAD_SOURCES))
  declare source: LeadSource;

  @AllowNull(false)
  @Default('new')
  @Column(DataType.ENUM(...LEAD_STATUSES))
  declare status: LeadStatus;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare assignedTo: string | null;

  @BelongsTo(() => User, { foreignKey: 'assignedTo', as: 'assignee' })
  declare assignee?: User;

  @Column(DataType.TEXT)
  declare notes: string | null;

  @Column(DataType.DATE)
  declare followUpAt: Date | null;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;

  @HasOne(() => Event, { foreignKey: 'leadId', as: 'event' })
  declare event?: Event;
}
