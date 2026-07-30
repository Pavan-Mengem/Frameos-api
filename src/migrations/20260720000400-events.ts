import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('events', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    client_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    lead_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'leads', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    title: { type: DataTypes.STRING, allowNull: false },
    event_type: { type: DataTypes.STRING, allowNull: true },
    event_date: { type: DataTypes.DATEONLY, allowNull: false },
    venue: { type: DataTypes.STRING, allowNull: true },
    total_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    advance_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    paid_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM('upcoming', 'in_progress', 'delivered', 'cancelled'),
      allowNull: false,
      defaultValue: 'upcoming',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await qi.addIndex('events', ['studio_id']);
  await qi.addIndex('events', ['studio_id', 'status']);
  await qi.addIndex('events', ['studio_id', 'event_date']);
  await qi.addIndex('events', ['studio_id', 'client_id']);

  await qi.createTable('team_assignments', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'events', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    role_on_shoot: {
      type: DataTypes.ENUM('lead_photographer', 'photographer', 'editor', 'assistant'),
      allowNull: false,
    },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await qi.addIndex('team_assignments', ['event_id', 'user_id', 'role_on_shoot'], { unique: true });
  await qi.addIndex('team_assignments', ['studio_id']);
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('team_assignments');
  await qi.dropTable('events');
  await sequelize.query('DROP TYPE IF EXISTS "enum_events_status";');
  await sequelize.query('DROP TYPE IF EXISTS "enum_team_assignments_role_on_shoot";');
};
