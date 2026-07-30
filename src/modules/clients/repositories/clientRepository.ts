import { Transaction } from 'sequelize';
import { Client, ClientAttributes, ClientCreationAttributes } from '../models/clientModel';
import { tenantScope } from '../../../utils/tenantScope';
import { BuiltQuery } from '../../../utils/queryBuilder';

export type CreateClientInput = Omit<ClientCreationAttributes, 'id' | 'studioId'>;
export type UpdateClientInput = Partial<CreateClientInput>;

/**
 * ONLY layer that touches the Client model. Static methods only. Every method
 * takes `studioId` first and pipes it through tenantScope() — cross-tenant
 * reads/writes are structurally impossible.
 */
export class ClientRepository {
  static create(studioId: string, data: CreateClientInput, tx?: Transaction): Promise<Client> {
    return Client.create({ ...data, studioId } as ClientCreationAttributes, { transaction: tx });
  }

  static findByIdScoped(studioId: string, id: number): Promise<Client | null> {
    return Client.findOne({ where: tenantScope(studioId, { id }) });
  }

  static findByPhoneScoped(studioId: string, phone: string): Promise<Client | null> {
    return Client.findOne({ where: tenantScope(studioId, { phone }) });
  }

  static findAndCountAllScoped(studioId: string, query: BuiltQuery): Promise<{ rows: Client[]; count: number }> {
    return Client.findAndCountAll({
      where: tenantScope(studioId, query.where),
      order: query.order,
      limit: query.limit,
      offset: query.offset,
    });
  }

  static async updateScoped(studioId: string, id: number, patch: Partial<ClientAttributes>): Promise<Client | null> {
    await Client.update(patch, { where: tenantScope(studioId, { id }) });
    return ClientRepository.findByIdScoped(studioId, id);
  }

  static softDeleteScoped(studioId: string, id: number): Promise<number> {
    return Client.destroy({ where: tenantScope(studioId, { id }) });
  }
}
