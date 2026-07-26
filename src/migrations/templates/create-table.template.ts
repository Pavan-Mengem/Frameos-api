import { DataTypes } from 'sequelize';
import type { Migration } from '../../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.createTable('__TABLE_NAME__', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    // ...add columns here
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true }, // paranoid soft-delete
  });
  await qi.addIndex('__TABLE_NAME__', ['studio_id']);
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().dropTable('__TABLE_NAME__');
};
