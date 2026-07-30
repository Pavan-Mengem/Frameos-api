import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.createTable('jobs', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    kind: {
      type: DataTypes.ENUM('thumbnail_generate', 'notification_send', 'invoice_pdf', 'quotation_pdf'),
      allowNull: false,
    },
    payload: { type: DataTypes.JSONB, allowNull: false },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'done', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    last_error: { type: DataTypes.TEXT, allowNull: true },
    run_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await qi.addIndex('jobs', ['status', 'run_at']);
  await qi.addIndex('jobs', ['studio_id']);
  await qi.addIndex('jobs', ['kind']);
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('jobs');
  await sequelize.query('DROP TYPE IF EXISTS "enum_jobs_kind";');
  await sequelize.query('DROP TYPE IF EXISTS "enum_jobs_status";');
};
