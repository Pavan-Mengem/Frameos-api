import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('galleries', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'events', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    title: { type: DataTypes.STRING, allowNull: false },
    slug: { type: DataTypes.STRING(80), allowNull: false },
    password_hash: { type: DataTypes.STRING, allowNull: true },
    expires_at: { type: DataTypes.DATE, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    cover_photo_id: { type: DataTypes.UUID, allowNull: true },
    view_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await qi.addIndex('galleries', ['studio_id']);
  await qi.addIndex('galleries', ['studio_id', 'event_id']);
  await qi.addIndex('galleries', ['slug'], { unique: true });

  await qi.createTable('albums', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    gallery_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'galleries', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    title: { type: DataTypes.STRING, allowNull: false },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await qi.addIndex('albums', ['studio_id']);
  await qi.addIndex('albums', ['gallery_id']);

  await qi.createTable('photos', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    gallery_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'galleries', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    album_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'albums', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    s3_key: { type: DataTypes.STRING, allowNull: false },
    s3_thumb_key: { type: DataTypes.STRING, allowNull: true },
    original_filename: { type: DataTypes.STRING, allowNull: true },
    mime_type: { type: DataTypes.STRING(80), allowNull: true },
    byte_size: { type: DataTypes.BIGINT, allowNull: true },
    width: { type: DataTypes.INTEGER, allowNull: true },
    height: { type: DataTypes.INTEGER, allowNull: true },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    is_uploaded: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await qi.addIndex('photos', ['studio_id']);
  await qi.addIndex('photos', ['gallery_id']);
  await qi.addIndex('photos', ['gallery_id', 'album_id']);
  await qi.addIndex('photos', ['s3_key'], { unique: true });

  await qi.createTable('favorites', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    gallery_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'galleries', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    photo_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'photos', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    client_identifier: { type: DataTypes.STRING(80), allowNull: false },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await qi.addIndex('favorites', ['studio_id']);
  await qi.addIndex('favorites', ['gallery_id']);
  await qi.addIndex('favorites', ['photo_id', 'client_identifier'], { unique: true });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('favorites');
  await qi.dropTable('photos');
  await qi.dropTable('albums');
  await qi.dropTable('galleries');
};
