import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.createTable('webhook_events', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    provider: { type: DataTypes.STRING, allowNull: false },
    event_id: { type: DataTypes.STRING, allowNull: false },
    event_type: { type: DataTypes.STRING, allowNull: false },
    payload_hash: { type: DataTypes.STRING, allowNull: false },
    processed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await qi.addIndex('webhook_events', ['provider', 'event_id'], { unique: true });
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().dropTable('webhook_events');
};
