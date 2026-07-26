import { DataTypes } from 'sequelize';
import type { Migration } from '../db/migrator';

export const up: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();

  await qi.createTable('payments', {
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
      allowNull: false,
      references: { model: 'events', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    kind: { type: DataTypes.ENUM('advance', 'balance', 'manual'), allowNull: false },
    amount_inr: { type: DataTypes.INTEGER, allowNull: false },
    currency: { type: DataTypes.STRING(3), allowNull: false, defaultValue: 'INR' },
    gateway: { type: DataTypes.ENUM('razorpay', 'manual'), allowNull: false },
    gateway_order_id: { type: DataTypes.STRING, allowNull: true },
    gateway_payment_id: { type: DataTypes.STRING, allowNull: true },
    method: {
      type: DataTypes.ENUM('upi', 'card', 'netbanking', 'emi', 'wallet', 'cash', 'other'),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('created', 'paid', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'created',
    },
    captured_at: { type: DataTypes.DATE, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    invoice_id: { type: DataTypes.UUID, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  });
  await qi.addIndex('payments', ['studio_id']);
  await qi.addIndex('payments', ['studio_id', 'event_id']);
  await qi.addIndex('payments', ['studio_id', 'status']);
  await qi.addIndex('payments', ['gateway_order_id'], { unique: true });
  await qi.addIndex('payments', ['gateway_payment_id'], { unique: true });

  await qi.createTable('invoices', {
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
      allowNull: false,
      references: { model: 'events', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    payment_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'payments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    invoice_number: { type: DataTypes.STRING(30), allowNull: false },
    issued_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    place_of_supply: { type: DataTypes.STRING(2), allowNull: true },
    studio_gstin_snapshot: { type: DataTypes.STRING(15), allowNull: true },
    subtotal_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    discount_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    taxable_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    cgst_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    sgst_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    igst_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    total_inr: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });
  await qi.addIndex('invoices', ['studio_id']);
  await qi.addIndex('invoices', ['studio_id', 'event_id']);
  await qi.addIndex('invoices', ['studio_id', 'invoice_number'], { unique: true });
  await qi.addIndex('invoices', ['payment_id'], { unique: true });
};

export const down: Migration = async ({ context: sequelize }) => {
  const qi = sequelize.getQueryInterface();
  await qi.dropTable('invoices');
  await qi.dropTable('payments');
  await sequelize.query('DROP TYPE IF EXISTS "enum_payments_kind";');
  await sequelize.query('DROP TYPE IF EXISTS "enum_payments_gateway";');
  await sequelize.query('DROP TYPE IF EXISTS "enum_payments_method";');
  await sequelize.query('DROP TYPE IF EXISTS "enum_payments_status";');
};
