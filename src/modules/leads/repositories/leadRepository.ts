import { Op, Transaction } from 'sequelize';
import { Lead, LeadCreationAttributes, LeadStatus } from '../models/leadModel';
import { tenantScope } from '../../../utils/tenantScope';
import { BuiltQuery } from '../../../utils/queryBuilder';

// eventDate/followUpAt accept ISO strings too — Sequelize coerces them for DATE/DATEONLY columns.
export type CreateLeadInput = Omit<LeadCreationAttributes, 'id' | 'studioId' | 'eventDate' | 'followUpAt'> & {
  eventDate?: string | Date | null;
  followUpAt?: string | Date | null;
};
export type UpdateLeadInput = Partial<CreateLeadInput>;

export class LeadRepository {
  static create(studioId: string, data: CreateLeadInput, tx?: Transaction): Promise<Lead> {
    return Lead.create({ ...data, studioId } as unknown as LeadCreationAttributes, { transaction: tx });
  }

  static findByIdScoped(studioId: string, id: number): Promise<Lead | null> {
    return Lead.findOne({ where: tenantScope(studioId, { id }) });
  }

  static findAndCountAllScoped(studioId: string, query: BuiltQuery): Promise<{ rows: Lead[]; count: number }> {
    return Lead.findAndCountAll({
      where: tenantScope(studioId, query.where),
      order: query.order,
      limit: query.limit,
      offset: query.offset,
    });
  }

  static async updateScoped(studioId: string, id: number, patch: UpdateLeadInput & { status?: LeadStatus; clientId?: number | null }): Promise<Lead | null> {
    await Lead.update(patch as unknown as LeadCreationAttributes, { where: tenantScope(studioId, { id }) });
    return LeadRepository.findByIdScoped(studioId, id);
  }

  static softDeleteScoped(studioId: string, id: number): Promise<number> {
    return Lead.destroy({ where: tenantScope(studioId, { id }) });
  }

  // Overdue = follow_up_at in the past and status not terminal. Used by dashboard.
  static countOverdue(studioId: string, now: Date): Promise<number> {
    return Lead.count({
      where: tenantScope(studioId, {
        status: { [Op.notIn]: ['won', 'lost'] },
        followUpAt: { [Op.lt]: now },
      }),
    });
  }

  static countByStatus(studioId: string): Promise<Array<{ status: LeadStatus; count: string }>> {
    return Lead.findAll({
      where: tenantScope(studioId),
      attributes: ['status', [Lead.sequelize!.fn('COUNT', Lead.sequelize!.col('id')), 'count']],
      group: ['status'],
      raw: true,
    }) as unknown as Promise<Array<{ status: LeadStatus; count: string }>>;
  }
}
