import {
  Table, Column, Model, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo, HasMany,
  DataType, CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Studio } from '../../studios/models/studioModel';
import { Lead } from '../../leads/models/leadModel';
import { Event } from '../../events/models/eventModel';
import { Quotation } from '../../quotations/models/quotationModel';

export interface ClientAttributes {
  id: string;
  studioId: string;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  notes: string | null;
  source: string | null; // 'referral' | 'instagram' | 'portfolio' | free-text
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface ClientCreationAttributes
  extends Optional<ClientAttributes, 'id' | 'phone' | 'email' | 'city' | 'notes' | 'source' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

/**
 * A studio's customer/contact record. Every studio-scoped method on
 * ClientRepository takes `studioId` as its first argument and folds it into
 * the `where` clause via tenantScope() (src/utils/tenantScope.ts) — cross-tenant
 * access is structurally impossible. There is no per-tenant database/connection
 * here (unlike CC360): frameos uses one shared database with this studioId column.
 */
@Table({
  tableName: 'clients',
  timestamps: true,
  paranoid: true,
  indexes: [{ fields: ['studio_id'] }, { fields: ['studio_id', 'phone'] }, { fields: ['studio_id', 'email'] }],
})
export class Client extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
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

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @Column(DataType.STRING)
  declare phone: string | null;

  @Column(DataType.STRING)
  declare email: string | null;

  @Column(DataType.STRING)
  declare city: string | null;

  @Column(DataType.TEXT)
  declare notes: string | null;

  @Column(DataType.STRING)
  declare source: string | null;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;

  @HasMany(() => Lead, { foreignKey: 'clientId', as: 'leads' })
  declare leads?: Lead[];

  @HasMany(() => Event, { foreignKey: 'clientId', as: 'events' })
  declare events?: Event[];

  @HasMany(() => Quotation, { foreignKey: 'clientId', as: 'quotations' })
  declare quotations?: Quotation[];
}
