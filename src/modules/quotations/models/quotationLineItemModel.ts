import {
  Table, Column, Model, PrimaryKey, AutoIncrement, Default, AllowNull, ForeignKey, BelongsTo,
  DataType,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { Quotation } from './quotationModel';

export interface QuotationLineItemAttributes {
  id: number;
  quotationId: number;
  hsnSac: string | null; // e.g. "998387"
  description: string;
  quantity: number;
  unitPriceInr: number;
  discountInr: number;
  gstRate: number; // 0 | 5 | 12 | 18 | 28
  taxableInr: number;
  cgstInr: number;
  sgstInr: number;
  igstInr: number;
  totalInr: number;
  sortOrder: number;
}

export interface QuotationLineItemCreationAttributes
  extends Optional<QuotationLineItemAttributes, 'id' | 'hsnSac' | 'discountInr' | 'taxableInr' | 'cgstInr' | 'sgstInr' | 'igstInr' | 'totalInr' | 'sortOrder'> {}

@Table({
  tableName: 'quotation_line_items',
  timestamps: false,
  paranoid: false,
  indexes: [{ fields: ['quotation_id'] }],
})
export class QuotationLineItem extends Model<QuotationLineItemAttributes, QuotationLineItemCreationAttributes> implements QuotationLineItemAttributes {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Quotation)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare quotationId: number;

  @BelongsTo(() => Quotation, { foreignKey: 'quotationId', as: 'quotation' })
  declare quotation?: Quotation;

  @Column(DataType.STRING(20))
  declare hsnSac: string | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @AllowNull(false)
  @Default(1)
  @Column(DataType.INTEGER)
  declare quantity: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare unitPriceInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare discountInr: number;

  @AllowNull(false)
  @Default(18)
  @Column(DataType.INTEGER)
  declare gstRate: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare taxableInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare cgstInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare sgstInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare igstInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare totalInr: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare sortOrder: number;
}
