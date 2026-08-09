import { Transaction } from 'sequelize';
import { Gallery, GalleryAttributes, GalleryCreationAttributes } from '../models/galleryModel';
import { Event } from '../../events/models/eventModel';
import { tenantScope } from '../../../utils/tenantScope';
import { BuiltQuery } from '../../../utils/queryBuilder';

export type CreateGalleryInput = Omit<GalleryCreationAttributes, 'id' | 'studioId'>;

export class GalleryRepository {
  static create(studioId: string, data: CreateGalleryInput, tx?: Transaction): Promise<Gallery> {
    return Gallery.create({ ...data, studioId } as GalleryCreationAttributes, { transaction: tx });
  }

  static findScoped(studioId: string, id: number): Promise<Gallery | null> {
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

  static update(studioId: string, id: number, patch: Partial<GalleryAttributes>) {
    return Gallery.update(patch, { where: tenantScope(studioId, { id }) });
  }

  static softDeleteScoped(studioId: string, id: number): Promise<number> {
    return Gallery.destroy({ where: tenantScope(studioId, { id }) });
  }

  static incrementView(id: number) {
    return Gallery.increment({ viewCount: 1 }, { where: { id } });
  }

  static countForStudio(studioId: string): Promise<number> {
    return Gallery.count({ where: tenantScope(studioId) });
  }

  /** Galleries attached to one client's events - used by the client portal
   *  aggregation. Galleries with no eventId can't be attributed to a client
   *  and are excluded (`required: true` on the join). */
  static findAllForClient(studioId: string, clientId: number): Promise<Gallery[]> {
    return Gallery.findAll({
      where: tenantScope(studioId, { isActive: true }),
      include: [{ model: Event, as: 'event', where: { clientId }, attributes: [], required: true }],
      order: [['created_at', 'DESC']],
    });
  }
}
