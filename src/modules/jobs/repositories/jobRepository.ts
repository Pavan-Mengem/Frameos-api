import { sequelize } from '../../../config/database';
import { Job, JobKind, JobCreationAttributes } from '../models/jobModel';

export class JobRepository {
  static enqueue(studioId: string, kind: JobKind, payload: object, runAt: Date = new Date()): Promise<Job> {
    return Job.create({ studioId, kind, payload, runAt } as JobCreationAttributes);
  }

  /**
   * Claim up to N pending jobs of a kind. Uses SELECT ... FOR UPDATE SKIP LOCKED
   * so N workers can concurrently pull disjoint batches with zero coordination.
   * Returns the claimed rows fully hydrated.
   */
  static async claim(kind: JobKind, batch: number): Promise<Job[]> {
    const [rows] = (await sequelize.query(
      `WITH picked AS (
         SELECT id FROM jobs
         WHERE kind = :kind AND status = 'pending' AND run_at <= NOW()
         ORDER BY run_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT :batch
       )
       UPDATE jobs SET status = 'running', attempts = attempts + 1, updated_at = NOW()
       FROM picked WHERE jobs.id = picked.id
       RETURNING jobs.*`,
      { replacements: { kind, batch } }
    )) as unknown as [Array<Record<string, unknown>>, unknown];
    return rows.map((r) => Job.build(r as unknown as JobCreationAttributes));
  }

  static markDone(id: string) {
    return Job.update({ status: 'done' }, { where: { id } });
  }

  static markFailed(id: string, error: string, retryInMs?: number) {
    return Job.update(
      {
        status: retryInMs ? 'pending' : 'failed',
        lastError: error,
        runAt: retryInMs ? new Date(Date.now() + retryInMs) : new Date(),
      },
      { where: { id } }
    );
  }
}
