import { Favorite } from '../models/favoriteModel';
import { tenantScope } from '../../../utils/tenantScope';

export class FavoriteRepository {
  static addFavorite(studioId: string, galleryId: string, photoId: string, clientIdentifier: string) {
    return Favorite.findOrCreate({
      where: { photoId, clientIdentifier },
      defaults: { studioId, galleryId, photoId, clientIdentifier },
    });
  }

  static removeFavorite(photoId: string, clientIdentifier: string): Promise<number> {
    return Favorite.destroy({ where: { photoId, clientIdentifier } });
  }

  static listForClient(galleryId: string, clientIdentifier: string): Promise<Favorite[]> {
    return Favorite.findAll({ where: { galleryId, clientIdentifier }, attributes: ['photoId'] });
  }

  static countForGallery(studioId: string, galleryId: string): Promise<number> {
    return Favorite.count({ where: tenantScope(studioId, { galleryId }) });
  }
}
