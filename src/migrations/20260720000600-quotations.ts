import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('quotations', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    studio_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'studios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    client_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'clients', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    event_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'events', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    quote_number: { type: DataTypes.STRING(30), allowNull: false },
    status: {
      type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected', 'expired'),
      allowNull: false,
      defaultValue: 'draft',
    },
    place_of_supply: { type: DataTypes.STRING(2), allowNull: true },
    studio_gstin_snapshot: { type: DataTypes.STRING(15), allowNull: true },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
    subtotal_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    discount_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    taxable_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    cgst_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sgst_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    igst_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    total_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    notes: { type: DataTypes.TEXT, allowNull: true },
    terms: { type: DataTypes.TEXT, allowNull: true },
    valid_until: { type: DataTypes.DATEONLY, allowNull: true },
    share_slug: { type: DataTypes.STRING(40), allowNull: true },
    sent_at: { type: DataTypes.DATE, allowNull: true },
    accepted_at: { type: DataTypes.DATE, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await qi.addIndex('quotations', ['studio_id']);
  await qi.addIndex('quotations', ['studio_id', 'status']);
  await qi.addIndex('quotations', ['studio_id', 'client_id']);
  await qi.addIndex('quotations', ['studio_id', 'quote_number'], { unique: true });
  await qi.addIndex('quotations', ['share_slug'], { unique: true }); // Postgres: NULLs are distinct

  await qi.createTable('quotation_line_items', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    quotation_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'quotations', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    hsn_sac: { type: DataTypes.STRING(20), allowNull: true },
    description: { type: DataTypes.STRING, allowNull: false },
    quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    unit_price_inr: { type: DataTypes.INTEGER, allowNull: false },
    discount_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    gst_rate: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 18 },
    taxable_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    cgst_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sgst_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    igst_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    total_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  });
  await qi.addIndex('quotation_line_items', ['quotation_id']);
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('quotation_line_items');
  await qi.dropTable('quotations');
  await sequelize.query('DROP TYPE IF EXISTS "enum_quotations_status";');
};
