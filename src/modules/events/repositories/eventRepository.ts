import { Op, Transaction } from 'sequelize';
import { sequelize } from '../../../config/database';
import { Event, EventCreationAttributes } from '../models/eventModel';
import { tenantScope } from '../../../utils/tenantScope';
import { BuiltQuery } from '../../../utils/queryBuilder';

// eventDate accepts ISO strings too — Sequelize coerces them for the DATEONLY column.
export type CreateEventInput = Omit<EventCreationAttributes, 'id' | 'studioId' | 'eventDate'> & {
  eventDate: string | Date;
};
export type UpdateEventInput = Partial<CreateEventInput>;

export class EventRepository {
  static create(studioId: string, data: CreateEventInput, tx?: Transaction): Promise<Event> {
    return Event.create({ ...data, studioId } as unknown as EventCreationAttributes, { transaction: tx });
  }

  static findByIdScoped(studioId: string, id: number): Promise<Event | null> {
    return Event.findOne({ where: tenantScope(studioId, { id }) });
  }

  static findAndCountAllScoped(studioId: string, query: BuiltQuery): Promise<{ rows: Event[]; count: number }> {
    return Event.findAndCountAll({
      where: tenantScope(studioId, query.where),
      order: query.order,
      limit: query.limit,
      offset: query.offset,
    });
  }

  static async updateScoped(studioId: string, id: number, patch: UpdateEventInput): Promise<Event | null> {
    await Event.update(patch as unknown as EventCreationAttributes, { where: tenantScope(studioId, { id }) });
    return EventRepository.findByIdScoped(studioId, id);
  }

  static softDeleteScoped(studioId: string, id: number): Promise<number> {
    return Event.destroy({ where: tenantScope(studioId, { id }) });
  }

  /**
   * Atomically bump paid_inr — the payments module calls this from a webhook.
   * Uses a raw increment so concurrent captures on the same event never race
   * to a stale read-modify-write.
   */
  static addPaid(studioId: string, id: number, deltaInr: number, tx?: Transaction) {
    return Event.increment({ paidInr: deltaInr }, { where: tenantScope(studioId, { id }), transaction: tx });
  }

  // --- dashboard aggregations ---
  static countUpcoming(studioId: string, now: Date): Promise<number> {
    return Event.count({
      where: tenantScope(studioId, {
        eventDate: { [Op.gte]: now },
        status: { [Op.in]: ['upcoming', 'in_progress'] },
      }),
    });
  }

  static async sumPendingBalance(studioId: string): Promise<number> {
    const [row] = (await sequelize.query(
      `SELECT COALESCE(SUM(GREATEST(total_inr - paid_inr, 0)), 0) AS pending
       FROM events
       WHERE studio_id = :studioId AND deleted_at IS NULL AND status != 'cancelled'`,
      { replacements: { studioId } }
    )) as unknown as [Array<{ pending: string }>, unknown];
    return Number(row[0]?.pending ?? 0);
  }
}
