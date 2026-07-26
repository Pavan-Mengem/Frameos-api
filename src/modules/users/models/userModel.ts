import {
  Table, Column, Model, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo, HasMany,
  DataType, CreatedAt, UpdatedAt, DeletedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Studio } from '../../studios/models/studioModel';
import { Lead } from '../../leads/models/leadModel';
import { TeamAssignment } from '../../events/models/teamAssignmentModel';

export const ROLES = ['owner', 'admin', 'photographer', 'editor', 'freelancer'] as const;
export type Role = (typeof ROLES)[number];

export interface UserAttributes {
  id: string;
  studioId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: Role;
  isActive: boolean;
  refreshTokenHash: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'email' | 'phone' | 'role' | 'isActive' | 'refreshTokenHash' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

@Table({
  tableName: 'users',
  timestamps: true,
  paranoid: true,
  indexes: [{ fields: ['studio_id'] }, { fields: ['phone'] }, { fields: ['email'] }],
})
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
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
  declare email: string | null;

  @Column(DataType.STRING)
  declare phone: string | null;

  @AllowNull(false)
  @Default('owner')
  @Column(DataType.ENUM(...ROLES))
  declare role: Role;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  declare isActive: boolean;

  @Column(DataType.STRING)
  declare refreshTokenHash: string | null;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
  @DeletedAt declare deletedAt: Date | null;

  @HasMany(() => Lead, { foreignKey: 'assignedTo', as: 'assignedLeads' })
  declare assignedLeads?: Lead[];

  @HasMany(() => TeamAssignment, { foreignKey: 'userId', as: 'shootAssignments' })
  declare shootAssignments?: TeamAssignment[];
}
