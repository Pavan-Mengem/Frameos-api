import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.addColumn('studios', 'theme_config', {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
  });
  await qi.addColumn('studios', 'draft_theme', {
    type: DataTypes.STRING,
    allowNull: true,
  });
  await qi.addColumn('studios', 'draft_theme_config', {
    type: DataTypes.JSONB,
    allowNull: true,
  });
  await qi.addColumn('studios', 'draft_updated_at', {
    type: DataTypes.DATE,
    allowNull: true,
  });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.removeColumn('studios', 'draft_updated_at');
  await qi.removeColumn('studios', 'draft_theme_config');
  await qi.removeColumn('studios', 'draft_theme');
  await qi.removeColumn('studios', 'theme_config');
};
