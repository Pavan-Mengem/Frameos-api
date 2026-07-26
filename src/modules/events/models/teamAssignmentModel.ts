import {
  Table, Column, Model, PrimaryKey, Default, AllowNull, ForeignKey, BelongsTo,
  DataType, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Event } from './eventModel';
import { Studio } from '../../studios/models/studioModel';
import { User } from '../../users/models/userModel';

export const TEAM_ROLES = ['lead_photographer', 'photographer', 'editor', 'assistant'] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export interface TeamAssignmentAttributes {
  id: string;
  studioId: string;
  eventId: string;
  userId: string; // users.id
  roleOnShoot: TeamRole;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeamAssignmentCreationAttributes
  extends Optional<TeamAssignmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/** Links an Event to a User with a role for the shoot (event <-> user). */
@Table({
  tableName: 'team_assignments',
  timestamps: true,
  paranoid: false,
  indexes: [
    { unique: true, fields: ['event_id', 'user_id', 'role_on_shoot'] },
    { fields: ['studio_id'] },
  ],
})
export class TeamAssignment extends Model<TeamAssignmentAttributes, TeamAssignmentCreationAttributes> implements TeamAssignmentAttributes {
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

  @ForeignKey(() => Event)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare eventId: string;

  @BelongsTo(() => Event, { foreignKey: 'eventId', as: 'event' })
  declare event?: Event;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare userId: string;

  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' })
  declare user?: User;

  @AllowNull(false)
  @Column(DataType.ENUM(...TEAM_ROLES))
  declare roleOnShoot: TeamRole;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}
