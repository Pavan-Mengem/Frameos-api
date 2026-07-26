import { Transaction } from 'sequelize';
import { User, UserCreationAttributes, Role } from '../models/userModel';
import { tenantScope } from '../../../utils/tenantScope';

export type CreateUserInput = Omit<UserCreationAttributes, 'id'>;

/**
 * Every studio-scoped method takes studioId first and injects it into `where`,
 * so cross-tenant reads/writes are structurally impossible.
 * Auth lookups (findByPhone/findByEmail/findByIdGlobal) are intentionally
 * global — login must resolve an identifier before a studio context exists.
 */
export class UserRepository {
  static create(data: CreateUserInput, tx?: Transaction): Promise<User> {
    return User.create(data as UserCreationAttributes, { transaction: tx });
  }

  // --- global (auth only) ---
  static findByPhone(phone: string): Promise<User | null> {
    return User.findOne({ where: { phone } });
  }

  static findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }

  static findByIdGlobal(id: string): Promise<User | null> {
    return User.findByPk(id);
  }

  // --- studio-scoped ---
  static findByIdScoped(studioId: string, id: string): Promise<User | null> {
    return User.findOne({ where: tenantScope(studioId, { id }) });
  }

  static listAndCount(studioId: string, filter: { role?: Role }, limit: number, offset: number) {
    return User.findAndCountAll({
      where: tenantScope(studioId, filter.role ? { role: filter.role } : undefined),
      limit,
      offset,
      order: [['created_at', 'DESC']],
    });
  }

  static setStatus(studioId: string, id: string, isActive: boolean) {
    return User.update({ isActive }, { where: tenantScope(studioId, { id }) });
  }

  static setRefreshHash(id: string, refreshTokenHash: string | null) {
    return User.update({ refreshTokenHash }, { where: { id } });
  }
}
