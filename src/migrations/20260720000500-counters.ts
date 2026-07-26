import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.createTable('counters', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    doc_type: { type: DataTypes.ENUM('quotation', 'invoice'), allowNull: false },
    fy: { type: DataTypes.STRING(4), allowNull: false },
    next_seq: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await qi.addIndex('counters', ['studio_id', 'doc_type', 'fy'], { unique: true });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('counters');
  await sequelize.query('DROP TYPE IF EXISTS "enum_counters_doc_type";');
};
