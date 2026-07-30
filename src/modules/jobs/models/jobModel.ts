import {
  Table, Column, Model, PrimaryKey, AutoIncrement, Default, AllowNull,
  DataType, CreatedAt, UpdatedAt,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';

export const JOB_STATUSES = ['pending', 'running', 'done', 'failed'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_KINDS = ['thumbnail_generate', 'notification_send', 'invoice_pdf', 'quotation_pdf'] as const;
export type JobKind = (typeof JOB_KINDS)[number];

export interface JobAttributes {
  id: number;
  studioId: string;
  kind: JobKind;
  payload: object;
  status: JobStatus;
  attempts: number;
  lastError: string | null;
  runAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JobCreationAttributes
  extends Optional<JobAttributes, 'id' | 'status' | 'attempts' | 'lastError' | 'runAt' | 'createdAt' | 'updatedAt'> {}

/**
 * Minimal background-job queue table. A separate worker process claims rows
 * via UPDATE ... SKIP LOCKED and runs them. Chosen over Redis-only queues so
 * every job is durable and auditable in the same DB as the source data.
 */
@Table({
  tableName: 'jobs',
  timestamps: true,
  paranoid: false,
  indexes: [
    { fields: ['status', 'run_at'] }, // worker claim query
    { fields: ['studio_id'] },
    { fields: ['kind'] },
  ],
})
export class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.UUID)
  declare studioId: string;

  @AllowNull(false)
  @Column(DataType.ENUM(...JOB_KINDS))
  declare kind: JobKind;

  @AllowNull(false)
  @Column(DataType.JSONB)
  declare payload: object;

  @AllowNull(false)
  @Default('pending')
  @Column(DataType.ENUM(...JOB_STATUSES))
  declare status: JobStatus;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  declare attempts: number;

  @Column(DataType.TEXT)
  declare lastError: string | null;

  @AllowNull(false)
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  declare runAt: Date;

  @CreatedAt declare createdAt: Date;
  @UpdatedAt declare updatedAt: Date;
}
