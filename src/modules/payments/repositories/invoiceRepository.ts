import { Transaction } from 'sequelize';
import { Invoice, InvoiceCreationAttributes } from '../models/invoiceModel';
import { Event } from '../../events/models/eventModel';
import { Client } from '../../clients/models/clientModel';
import { tenantScope } from '../../../utils/tenantScope';
import { BuiltQuery } from '../../../utils/queryBuilder';

export type CreateInvoiceInput = Omit<InvoiceCreationAttributes, 'id' | 'issuedAt' | 'createdAt' | 'updatedAt'>;

const EVENT_INCLUDE = {
  model: Event,
  as: 'event',
  attributes: ['id', 'title', 'clientId'],
  include: [{ model: Client, as: 'client', attributes: ['id', 'name', 'phone', 'email'] }],
};

export class InvoiceRepository {
  static create(data: CreateInvoiceInput, tx: Transaction): Promise<Invoice> {
    return Invoice.create(data as InvoiceCreationAttributes, { transaction: tx });
  }

  static findByIdScoped(studioId: string, id: number): Promise<Invoice | null> {
    return Invoice.findOne({ where: tenantScope(studioId, { id }), include: [EVENT_INCLUDE] });
  }

  static findAndCountAllScoped(studioId: string, query: BuiltQuery): Promise<{ rows: Invoice[]; count: number }> {
    return Invoice.findAndCountAll({
      where: tenantScope(studioId, query.where),
      order: query.order,
      limit: query.limit,
      offset: query.offset,
      include: [EVENT_INCLUDE],
    });
  }

  /** Scoped to a single client rather than the whole studio — used by the client portal aggregation. */
  static findAllForClient(studioId: string, clientId: number): Promise<Invoice[]> {
    return Invoice.findAll({
      where: tenantScope(studioId, {}),
      include: [{ ...EVENT_INCLUDE, where: { clientId }, required: true }],
      order: [['issuedAt', 'DESC']],
    });
  }
}
