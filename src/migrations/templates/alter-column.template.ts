import { DataTypes } from 'sequelize';
import type { Migration } from '../../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().changeColumn('__TABLE_NAME__', '__COLUMN_NAME__', {
    type: DataTypes.STRING,
    allowNull: true,
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().changeColumn('__TABLE_NAME__', '__COLUMN_NAME__', {
    type: DataTypes.STRING,
    allowNull: false,
  });
};
