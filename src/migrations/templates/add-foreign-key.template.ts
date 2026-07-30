import { DataTypes } from 'sequelize';
import type { Migration } from '../../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  // INTEGER by default — switch to DataTypes.UUID only if __REFERENCED_TABLE__
  // is 'studios' or 'users' (the standing exception to auto-increment ids).
  await qi.addColumn('__TABLE_NAME__', '__COLUMN_NAME__', {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: '__REFERENCED_TABLE__', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
  await qi.addIndex('__TABLE_NAME__', ['__COLUMN_NAME__']);
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().removeColumn('__TABLE_NAME__', '__COLUMN_NAME__');
};
