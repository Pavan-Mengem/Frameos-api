import { Op, Transaction } from 'sequelize';
import { Payment, PaymentCreationAttributes, PaymentMethod } from '../models/paymentModel';
import { tenantScope } from '../../../utils/tenantScope';
import { BuiltQuery } from '../../../utils/queryBuilder';

export type CreatePaymentInput = Omit<PaymentCreationAttributes, 'id' | 'studioId'>;

export class PaymentRepository {
  static create(studioId: string, data: CreatePaymentInput, tx?: Transaction): Promise<Payment> {
    return Payment.create({ ...data, studioId } as unknown as PaymentCreationAttributes, { transaction: tx });
  }

  static findByIdScoped(studioId: string, id: number, tx?: Transaction): Promise<Payment | null> {
    return Payment.findOne({ where: tenantScope(studioId, { id }), transaction: tx });
  }

  static findByGatewayOrderId(gatewayOrderId: string): Promise<Payment | null> {
    return Payment.findOne({ where: { gatewayOrderId } });
  }

  static update(studioId: string, id: number, patch: Partial<CreatePaymentInput> & { invoiceId?: number }, tx?: Transaction) {
    return Payment.update(patch as unknown as PaymentCreationAttributes, { where: tenantScope(studioId, { id }), transaction: tx });
  }

  static markPaidByOrder(gatewayOrderId: string, gatewayPaymentId: string, method: PaymentMethod | null, tx: Transaction) {
    return Payment.update(
      { status: 'paid', gatewayPaymentId, method, capturedAt: new Date() },
      { where: { gatewayOrderId, status: { [Op.ne]: 'paid' } }, transaction: tx }
    );
  }

  static findAndCountAllScoped(studioId: string, query: BuiltQuery): Promise<{ rows: Payment[]; count: number }> {
    return Payment.findAndCountAll({
      where: tenantScope(studioId, query.where),
      order: query.order,
      limit: query.limit,
      offset: query.offset,
    });
  }
}
