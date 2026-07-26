import {
  Table, Column, Model, PrimaryKey, Default, AllowNull,
  DataType, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';

export const DOC_TYPES = ['quotation', 'invoice'] as const;
export type DocType = (typeof DOC_TYPES)[number];

export interface CounterAttributes {
  id: string;
  studioId: string;
  docType: DocType;
  fy: string; // e.g. "2526"
  nextSeq: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CounterCreationAttributes
  extends Optional<CounterAttributes, 'id' | 'nextSeq' | 'createdAt' | 'updatedAt'> {}

/**
 * Per-studio, per-FY, per-doc-type sequence counter. Backs the sequential
 * quotation and invoice numbering the GST law requires. Concurrent
 * allocations are serialized via row-level UPDATE ... RETURNING.
 */
@Table({
  tableName: 'counters',
  timestamps: true,
  paranoid: false,
  indexes: [{ unique: true, fields: ['studio_id', 'doc_type', 'fy'] }],
})
export class Counter extends Model<CounterAttributes, CounterCreationAttributes> implements CounterAttributes {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare studioId: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...DOC_TYPES))
  declare docType: DocType;

  @AllowNull(false)
  @Column(DataType.STRING(4))
  declare fy: string;

  @AllowNull(false)
  @Default(1)
  @Column(DataType.INTEGER)
  declare nextSeq: number;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}
