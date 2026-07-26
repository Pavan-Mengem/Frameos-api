import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.createTable('leads', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    name: { type: DataTypes.STRING, allowNull: false },
    phone: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
    event_type: { type: DataTypes.STRING, allowNull: true },
    event_date: { type: DataTypes.DATEONLY, allowNull: true },
    venue: { type: DataTypes.STRING, allowNull: true },
    budget_inr: { type: DataTypes.INTEGER, allowNull: true },
    source: {
      type: DataTypes.ENUM('portfolio', 'whatsapp', 'referral', 'instagram', 'walk_in', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'quoted', 'won', 'lost'),
      allowNull: false,
      defaultValue: 'new',
    },
    assigned_to: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    follow_up_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await qi.addIndex('leads', ['studio_id']);
  await qi.addIndex('leads', ['studio_id', 'status']);
  await qi.addIndex('leads', ['studio_id', 'event_date']);
  await qi.addIndex('leads', ['studio_id', 'assigned_to']);
  await qi.addIndex('leads', ['studio_id', 'follow_up_at']);
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().dropTable('leads');
  await sequelize.query('DROP TYPE IF EXISTS "enum_leads_source";');
  await sequelize.query('DROP TYPE IF EXISTS "enum_leads_status";');
};
