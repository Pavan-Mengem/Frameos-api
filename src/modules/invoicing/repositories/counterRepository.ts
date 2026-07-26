import { Transaction } from 'sequelize';
import { sequelize } from '../../../config/database';
import { Counter, DocType } from '../models/counterModel';

/**
 * Atomically allocate the next sequence number for (studio, docType, fy).
 *
 * Two-phase to survive contention on Postgres:
 *  1. Insert-if-missing with next_seq=2, capturing 1 as the allocation.
 *  2. Otherwise UPDATE ... RETURNING to atomically increment and read.
 *
 * Both branches run inside the caller's transaction so the number is only
 * consumed if the surrounding write (e.g. quotation insert) commits.
 */
export class CounterRepository {
  static async allocateNext(studioId: string, docType: DocType, fy: string, tx: Transaction): Promise<number> {
    // Upsert path: create row if it doesn't exist; then always UPDATE ... RETURNING.
    await Counter.findOrCreate({
      where: { studioId, docType, fy },
      defaults: { studioId, docType, fy, nextSeq: 1 },
      transaction: tx,
    });
    const [rows] = (await sequelize.query(
      `UPDATE counters
       SET next_seq = next_seq + 1, updated_at = NOW()
       WHERE studio_id = :studioId AND doc_type = :docType AND fy = :fy
       RETURNING next_seq - 1 AS allocated`,
      {
        replacements: { studioId, docType, fy },
        transaction: tx,
      }
    )) as unknown as [Array<{ allocated: number }>, unknown];
    return Number(rows[0].allocated);
  }
}

/** Formats an allocated integer as a printable document number. */
export const formatDocNumber = (kind: 'Q' | 'INV', fy: string, seq: number): string =>
  `${kind}-${fy}-${String(seq).padStart(6, '0')}`;
