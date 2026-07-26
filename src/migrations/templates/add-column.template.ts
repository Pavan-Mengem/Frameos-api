import { DataTypes } from 'sequelize';
import type { Migration } from '../../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().addColumn('__TABLE_NAME__', '__COLUMN_NAME__', {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().removeColumn('__TABLE_NAME__', '__COLUMN_NAME__');
};
