import { Transaction } from 'sequelize';
import { Invoice, InvoiceCreationAttributes } from '../models/invoiceModel';

export type CreateInvoiceInput = Omit<InvoiceCreationAttributes, 'id' | 'issuedAt' | 'createdAt' | 'updatedAt'>;

export class InvoiceRepository {
  static create(data: CreateInvoiceInput, tx: Transaction): Promise<Invoice> {
    return Invoice.create(data as InvoiceCreationAttributes, { transaction: tx });
  }
}
