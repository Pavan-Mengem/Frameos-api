import { Transaction } from 'sequelize';
import { QuotationLineItem, QuotationLineItemCreationAttributes } from '../models/quotationLineItemModel';

export class QuotationLineItemRepository {
  static addLines(rows: QuotationLineItemCreationAttributes[], tx?: Transaction): Promise<QuotationLineItem[]> {
    return QuotationLineItem.bulkCreate(rows, { transaction: tx });
  }

  static deleteLines(quotationId: number, tx?: Transaction): Promise<number> {
    return QuotationLineItem.destroy({ where: { quotationId }, transaction: tx });
  }

  static findLinesFor(quotationId: number): Promise<QuotationLineItem[]> {
    return QuotationLineItem.findAll({ where: { quotationId }, order: [['sort_order', 'ASC']] });
  }
}
