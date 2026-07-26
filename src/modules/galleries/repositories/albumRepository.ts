import { Album, AlbumAttributes } from '../models/albumModel';
import { tenantScope } from '../../../utils/tenantScope';

export class AlbumRepository {
  static create(studioId: string, galleryId: string, title: string, sortOrder: number): Promise<Album> {
    return Album.create({ studioId, galleryId, title, sortOrder });
  }

  static listForGallery(studioId: string, galleryId: string): Promise<Album[]> {
    return Album.findAll({ where: tenantScope(studioId, { galleryId }), order: [['sort_order', 'ASC']] });
  }

  static update(studioId: string, id: string, patch: Partial<AlbumAttributes>) {
    return Album.update(patch, { where: tenantScope(studioId, { id }) });
  }

  // Album is not paranoid (no deletedAt) — this is a hard delete.
  static deleteScoped(studioId: string, id: string): Promise<number> {
    return Album.destroy({ where: tenantScope(studioId, { id }) });
  }
}
