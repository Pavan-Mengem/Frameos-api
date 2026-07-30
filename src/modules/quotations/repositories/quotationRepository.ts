import { Transaction } from 'sequelize';
import { Quotation, QuotationCreationAttributes, QuotationStatus } from '../models/quotationModel';
import { tenantScope } from '../../../utils/tenantScope';
import { BuiltQuery } from '../../../utils/queryBuilder';

export type CreateQuotationInput = Omit<QuotationCreationAttributes, 'id' | 'studioId' | 'validUntil'> & {
  validUntil?: string | Date | null;
};
export type UpdateQuotationInput = Partial<CreateQuotationInput>;

export class QuotationRepository {
  static create(studioId: string, data: CreateQuotationInput, tx?: Transaction): Promise<Quotation> {
    return Quotation.create({ ...data, studioId } as unknown as QuotationCreationAttributes, { transaction: tx });
  }

  static findByIdScoped(studioId: string, id: number): Promise<Quotation | null> {
    return Quotation.findOne({ where: tenantScope(studioId, { id }) });
  }

  static findByShareSlug(slug: string): Promise<Quotation | null> {
    return Quotation.findOne({ where: { shareSlug: slug } });
  }

  static findAndCountAllScoped(studioId: string, query: BuiltQuery): Promise<{ rows: Quotation[]; count: number }> {
    return Quotation.findAndCountAll({
      where: tenantScope(studioId, query.where),
      order: query.order,
      limit: query.limit,
      offset: query.offset,
    });
  }

  static update(studioId: string, id: number, patch: UpdateQuotationInput, tx?: Transaction) {
    return Quotation.update(patch as unknown as QuotationCreationAttributes, { where: tenantScope(studioId, { id }), transaction: tx });
  }

  static setShareSlug(studioId: string, id: number, slug: string, tx?: Transaction) {
    return Quotation.update(
      { shareSlug: slug, status: 'sent', sentAt: new Date() },
      { where: tenantScope(studioId, { id }), transaction: tx }
    );
  }

  static setStatus(studioId: string, id: number, status: QuotationStatus, extra: Partial<Record<string, unknown>> = {}) {
    return Quotation.update({ status, ...extra } as unknown as QuotationCreationAttributes, { where: tenantScope(studioId, { id }) });
  }

  static softDeleteScoped(studioId: string, id: number): Promise<number> {
    return Quotation.destroy({ where: tenantScope(studioId, { id }) });
  }
}
