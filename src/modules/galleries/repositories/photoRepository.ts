import { Op, Transaction } from 'sequelize';
import { Photo, PhotoAttributes, PhotoCreationAttributes } from '../models/photoModel';
import { tenantScope } from '../../../utils/tenantScope';

export class PhotoRepository {
  static bulkCreate(rows: PhotoCreationAttributes[], tx?: Transaction): Promise<Photo[]> {
    return Photo.bulkCreate(rows, { transaction: tx });
  }

  static confirmScoped(studioId: string, ids: number[]) {
    return Photo.update(
      { isUploaded: true },
      { where: tenantScope(studioId, { id: { [Op.in]: ids } }) }
    );
  }

  static listForGallery(studioId: string, galleryId: number, onlyUploaded = true): Promise<Photo[]> {
    return Photo.findAll({
      where: tenantScope(studioId, {
        galleryId,
        ...(onlyUploaded ? { isUploaded: true } : {}),
      }),
      order: [['sort_order', 'ASC'], ['created_at', 'ASC']],
    });
  }

  static findScoped(studioId: string, id: number): Promise<Photo | null> {
    return Photo.findOne({ where: tenantScope(studioId, { id }) });
  }

  static update(studioId: string, id: number, patch: Partial<PhotoAttributes>) {
    return Photo.update(patch, { where: tenantScope(studioId, { id }) });
  }

  static softDeleteScoped(studioId: string, id: number): Promise<number> {
    return Photo.destroy({ where: tenantScope(studioId, { id }) });
  }
}
