import {
  Table, Column, Model, PrimaryKey, AutoIncrement, Default, AllowNull,
  DataType, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';

export const OTP_TYPES = ['sms', 'email'] as const;
export type OtpType = (typeof OTP_TYPES)[number];

export interface OtpAttributes {
  id: number;
  identifier: string; // phone or email
  otpHash: string;
  type: OtpType;
  purpose: string;
  expiresAt: Date;
  attempts: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface OtpCreationAttributes
  extends Optional<OtpAttributes, 'id' | 'attempts' | 'createdAt' | 'updatedAt'> {}

/** OTP is an auth concern, so it lives in the users module. */
@Table({
  tableName: 'otps',
  timestamps: true,
  paranoid: false,
  indexes: [{ fields: ['identifier'] }],
})
export class Otp extends Model<OtpAttributes, OtpCreationAttributes> implements OtpAttributes {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare identifier: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare otpHash: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...OTP_TYPES))
  declare type: OtpType;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare purpose: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare expiresAt: Date;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare attempts: number;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}
