import { Transaction } from 'sequelize';
import { Studio, StudioAttributes, StudioCreationAttributes } from '../models/studioModel';

export type CreateStudioInput = Pick<StudioCreationAttributes, 'name' | 'slug'> &
  Partial<Pick<StudioCreationAttributes, 'email' | 'phone' | 'gstin'>>;

/** Studios are the tenant root, so these methods are NOT studio-scoped. */
export class StudioRepository {
  static create(data: CreateStudioInput, tx?: Transaction): Promise<Studio> {
    return Studio.create(data as StudioCreationAttributes, { transaction: tx });
  }

  static findById(id: string): Promise<Studio | null> {
    return Studio.findByPk(id);
  }

  static findBySlug(slug: string): Promise<Studio | null> {
    return Studio.findOne({ where: { slug } });
  }

  static update(id: string, patch: Partial<StudioAttributes>) {
    return Studio.update(patch, { where: { id } });
  }
}
