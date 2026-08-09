import {
  Table, Column, Model, PrimaryKey, Default, AllowNull, Unique, HasMany,
  DataType, CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Client } from '../../clients/models/clientModel';
import { Lead } from '../../leads/models/leadModel';
import { Event } from '../../events/models/eventModel';
import { User } from '../../users/models/userModel';
import { Quotation } from '../../quotations/models/quotationModel';
import { Payment } from '../../payments/models/paymentModel';
import { Invoice } from '../../payments/models/invoiceModel';
import { Gallery } from '../../galleries/models/galleryModel';

export const PLANS = ['free', 'pro', 'studio'] as const;
export type Plan = (typeof PLANS)[number];

export interface StudioAttributes {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  plan: Plan;
  gstin: string | null; // India: GST identification number
  theme: string;        // active portfolio theme key
  themeConfig: Record<string, unknown>;    // published theme customization (accent/font/section toggles)
  draftTheme: string | null;               // pending draft's theme key override; null = no draft
  draftThemeConfig: Record<string, unknown> | null; // pending draft's config override; null = no draft
  draftUpdatedAt: Date | null;
  settings: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface StudioCreationAttributes
  extends Optional<
    StudioAttributes,
    | 'id' | 'email' | 'phone' | 'plan' | 'gstin' | 'theme' | 'themeConfig' | 'draftTheme'
    | 'draftThemeConfig' | 'draftUpdatedAt' | 'settings' | 'createdAt' | 'updatedAt' | 'deletedAt'
  > {}

/** Studios are the tenant root — every other tenant-owned table hangs off studioId. */
@Table({ tableName: 'studios', timestamps: true, paranoid: true })
export class Studio extends Model<StudioAttributes, StudioCreationAttributes> implements StudioAttributes {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING)
  declare slug: string;

  @Column(DataType.STRING)
  declare email: string | null;

  @Column(DataType.STRING)
  declare phone: string | null;

  @AllowNull(false)
  @Default('free')
  @Column(DataType.ENUM(...PLANS))
  declare plan: Plan;

  @Column(DataType.STRING(15))
  declare gstin: string | null;

  @AllowNull(false)
  @Default('minimal-editorial')
  @Column(DataType.STRING)
  declare theme: string;

  @AllowNull(false)
  @Default({})
  @Column(DataType.JSONB)
  declare themeConfig: Record<string, unknown>;

  @Column(DataType.STRING)
  declare draftTheme: string | null;

  @Column(DataType.JSONB)
  declare draftThemeConfig: Record<string, unknown> | null;

  @Column(DataType.DATE)
  declare draftUpdatedAt: Date | null;

  @AllowNull(false)
  @Default({})
  @Column(DataType.JSONB)
  declare settings: Record<string, unknown>;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;

  @HasMany(() => Client, { foreignKey: 'studioId', as: 'clients' })
  declare clients?: Client[];

  @HasMany(() => Lead, { foreignKey: 'studioId', as: 'leads' })
  declare leads?: Lead[];

  @HasMany(() => Event, { foreignKey: 'studioId', as: 'events' })
  declare events?: Event[];

  @HasMany(() => User, { foreignKey: 'studioId', as: 'users' })
  declare users?: User[];

  @HasMany(() => Quotation, { foreignKey: 'studioId', as: 'quotations' })
  declare quotations?: Quotation[];

  @HasMany(() => Payment, { foreignKey: 'studioId', as: 'payments' })
  declare payments?: Payment[];

  @HasMany(() => Invoice, { foreignKey: 'studioId', as: 'invoices' })
  declare invoices?: Invoice[];

  @HasMany(() => Gallery, { foreignKey: 'studioId', as: 'galleries' })
  declare galleries?: Gallery[];
}
