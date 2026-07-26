import { Transaction } from 'sequelize';
import { Gallery, GalleryAttributes, GalleryCreationAttributes } from '../models/galleryModel';
import { tenantScope } from '../../../utils/tenantScope';
import { BuiltQuery } from '../../../utils/queryBuilder';

export type CreateGalleryInput = Omit<GalleryCreationAttributes, 'id' | 'studioId'>;

export class GalleryRepository {
  static create(studioId: string, data: CreateGalleryInput, tx?: Transaction): Promise<Gallery> {
    return Gallery.create({ ...data, studioId } as GalleryCreationAttributes, { transaction: tx });
  }

  static findScoped(studioId: string, id: string): Promise<Gallery | null> {
    return Gallery.findOne({ where: tenantScope(studioId, { id }) });
  }

  static findBySlug(slug: string): Promise<Gallery | null> {
    return Gallery.findOne({ where: { slug } });
  }

  static findAndCountAllScoped(studioId: string, query: BuiltQuery): Promise<{ rows: Gallery[]; count: number }> {
    return Gallery.findAndCountAll({
      where: tenantScope(studioId, query.where),
      order: query.order,
      limit: query.limit,
      offset: query.offset,
    });
  }

  static update(studioId: string, id: string, patch: Partial<GalleryAttributes>) {
    return Gallery.update(patch, { where: tenantScope(studioId, { id }) });
  }

  static softDeleteScoped(studioId: string, id: string): Promise<number> {
    return Gallery.destroy({ where: tenantScope(studioId, { id }) });
  }

  static incrementView(id: string) {
    return Gallery.increment({ viewCount: 1 }, { where: { id } });
  }

  static countForStudio(studioId: string): Promise<number> {
    return Gallery.count({ where: tenantScope(studioId) });
  }
}
