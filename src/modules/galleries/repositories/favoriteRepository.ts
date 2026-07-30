import { Favorite } from '../models/favoriteModel';
import { tenantScope } from '../../../utils/tenantScope';

export class FavoriteRepository {
  static addFavorite(studioId: string, galleryId: number, photoId: number, clientIdentifier: string) {
    return Favorite.findOrCreate({
      where: { photoId, clientIdentifier },
      defaults: { studioId, galleryId, photoId, clientIdentifier },
    });
  }

  static removeFavorite(photoId: number, clientIdentifier: string): Promise<number> {
    return Favorite.destroy({ where: { photoId, clientIdentifier } });
  }

  static listForClient(galleryId: number, clientIdentifier: string): Promise<Favorite[]> {
    return Favorite.findAll({ where: { galleryId, clientIdentifier }, attributes: ['photoId'] });
  }

  static countForGallery(studioId: string, galleryId: number): Promise<number> {
    return Favorite.count({ where: tenantScope(studioId, { galleryId }) });
  }
}
