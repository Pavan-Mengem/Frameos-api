import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator';

// Baseline: creates the tables that already existed when migrations were introduced
// (studios, users, otps). All subsequent schema changes go through their own migrations.
export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('studios', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    plan: { type: DataTypes.ENUM('free', 'pro', 'studio'), allowNull: false, defaultValue: 'free' },
    gstin: { type: DataTypes.STRING(15), allowNull: true },
    theme: { type: DataTypes.STRING, allowNull: false, defaultValue: 'minimal-editorial' },
    settings: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });

  await qi.createTable('users', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'photographer', 'editor', 'freelancer'),
      allowNull: false,
      defaultValue: 'owner',
    },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    refresh_token_hash: { type: DataTypes.STRING, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await qi.addIndex('users', ['studio_id']);
  await qi.addIndex('users', ['phone']);
  await qi.addIndex('users', ['email']);

  await qi.createTable('otps', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    identifier: { type: DataTypes.STRING, allowNull: false },
    otp_hash: { type: DataTypes.STRING, allowNull: false },
    type: { type: DataTypes.ENUM('sms', 'email'), allowNull: false },
    purpose: { type: DataTypes.STRING, allowNull: false },
    expires_at: { type: DataTypes.DATE, allowNull: false },
    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await qi.addIndex('otps', ['identifier']);
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('otps');
  await qi.dropTable('users');
  await qi.dropTable('studios');
  // Postgres ENUM cleanup — safe if types don't exist.
  await sequelize.query('DROP TYPE IF EXISTS "enum_studios_plan";');
  await sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
  await sequelize.query('DROP TYPE IF EXISTS "enum_otps_type";');
};
