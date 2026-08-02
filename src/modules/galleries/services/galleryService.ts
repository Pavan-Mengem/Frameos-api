import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { ApiResponse, buildError, buildSuccess } from '../../../utils/response';
import { toErrorResponse } from '../../../utils/errorHandler';
import { buildListResponse } from '../../../utils/pagination';
import { BuiltQuery } from '../../../utils/queryBuilder';
import { logger } from '../../../config/logger';
import { JobRepository } from '../../jobs';
import { GalleryRepository, CreateGalleryInput } from '../repositories/galleryRepository';
import { AlbumRepository } from '../repositories/albumRepository';
import { PhotoRepository } from '../repositories/photoRepository';
import { FavoriteRepository } from '../repositories/favoriteRepository';
import { buildOriginalKey, presignPut, readUrl, deleteObjects } from '../helpers/s3.helper';
import { signGalleryAccess, verifyGalleryAccess } from '../helpers/gallery-access.helper';
import { Gallery } from '../models/galleryModel';
import { Photo, PhotoCreationAttributes } from '../models/photoModel';
import { Album } from '../models/albumModel';
import { MAX_IMAGE_BYTES as MAX_UPLOAD_BYTES, ALLOWED_IMAGE_MIME as ALLOWED_MIME } from '../../../utils/imageUpload';

const slugify = (title: string): string =>
  title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'gallery';

/** Slug uniqueness is global; try with a random suffix on collision. */
const uniqueSlug = async (base: string): Promise<string> => {
  const clean = slugify(base);
  for (let i = 0; i < 4; i++) {
    const candidate = i === 0 ? clean : `${clean}-${randomBytes(3).toString('hex')}`;
    const existing = await GalleryRepository.findBySlug(candidate);
    if (!existing) return candidate;
  }
  return `${clean}-${randomBytes(6).toString('hex')}`;
};

const sanitizeGallery = (g: Gallery) => ({
  id: g.id,
  studioId: g.studioId,
  eventId: g.eventId,
  title: g.title,
  slug: g.slug,
  hasPassword: Boolean(g.passwordHash),
  expiresAt: g.expiresAt,
  isActive: g.isActive,
  coverPhotoId: g.coverPhotoId,
  viewCount: g.viewCount,
  createdAt: g.createdAt,
  updatedAt: g.updatedAt,
});

const sanitizePhoto = async (p: Photo, includeUrls: boolean) => ({
  id: p.id,
  galleryId: p.galleryId,
  albumId: p.albumId,
  originalFilename: p.originalFilename,
  mimeType: p.mimeType,
  byteSize: p.byteSize,
  width: p.width,
  height: p.height,
  sortOrder: p.sortOrder,
  isUploaded: p.isUploaded,
  url: includeUrls && p.isUploaded ? await readUrl(p.s3ThumbKey ?? p.s3Key) : null,
  fullUrl: includeUrls && p.isUploaded ? await readUrl(p.s3Key) : null,
  createdAt: p.createdAt,
});

const sanitizeAlbum = (a: Album) => ({
  id: a.id, galleryId: a.galleryId, title: a.title, sortOrder: a.sortOrder,
});

const assertActive = (g: Gallery): string | null => {
  if (!g.isActive) return 'Gallery not available';
  if (g.expiresAt && g.expiresAt.getTime() < Date.now()) return 'Gallery expired';
  return null;
};

export class GalleryService {
  static async create(studioId: string, dto: { eventId?: number; title: string; password?: string; expiresAt?: string }): Promise<ApiResponse> {
    try {
      const slug = await uniqueSlug(dto.title);
      const passwordHash = dto.password ? await bcrypt.hash(dto.password, 10) : null;
      const g = await GalleryRepository.create(studioId, {
        eventId: dto.eventId ?? null,
        title: dto.title,
        slug,
        passwordHash,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      } as CreateGalleryInput);
      logger.info({ studioId, galleryId: g.id, slug: g.slug }, 'Gallery created');
      return buildSuccess(sanitizeGallery(g), undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to create gallery');
    }
  }

  static async list(studioId: string, query: BuiltQuery): Promise<ApiResponse> {
    try {
      const { rows, count } = await GalleryRepository.findAndCountAllScoped(studioId, query);
      return buildListResponse(rows.map(sanitizeGallery), count, query.page);
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve galleries');
    }
  }

  static async get(studioId: string, id: number): Promise<ApiResponse> {
    try {
      const g = await GalleryRepository.findScoped(studioId, id);
      if (!g) return buildError('Gallery not found', 404);
      const albums = await AlbumRepository.listForGallery(studioId, id);
      const photos = await PhotoRepository.listForGallery(studioId, id, false);
      const favCount = await FavoriteRepository.countForGallery(studioId, id);
      return buildSuccess({
        ...sanitizeGallery(g),
        favoriteCount: favCount,
        albums: albums.map(sanitizeAlbum),
        photos: await Promise.all(photos.map((p) => sanitizePhoto(p, true))),
      });
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve gallery');
    }
  }

  static async update(studioId: string, id: number, dto: {
    title?: string; password?: string | null; expiresAt?: string | null;
    isActive?: boolean; coverPhotoId?: number | null;
  }): Promise<ApiResponse> {
    try {
      const g = await GalleryRepository.findScoped(studioId, id);
      if (!g) return buildError('Gallery not found', 404);
      const patch: Partial<Gallery> = {};
      if (dto.title !== undefined) patch.title = dto.title;
      if (dto.password === null) patch.passwordHash = null;
      else if (dto.password) patch.passwordHash = await bcrypt.hash(dto.password, 10);
      if (dto.expiresAt !== undefined) patch.expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;
      if (dto.isActive !== undefined) patch.isActive = dto.isActive;
      if (dto.coverPhotoId !== undefined) patch.coverPhotoId = dto.coverPhotoId;
      await GalleryRepository.update(studioId, id, patch);
      logger.info({ studioId, galleryId: id }, 'Gallery updated');
      return GalleryService.get(studioId, id);
    } catch (error) {
      return toErrorResponse(error, 'Failed to update gallery');
    }
  }

  static async remove(studioId: string, id: number): Promise<ApiResponse> {
    try {
      const affected = await GalleryRepository.softDeleteScoped(studioId, id);
      if (!affected) return buildError('Gallery not found', 404);
      logger.info({ studioId, galleryId: id }, 'Gallery deleted');
      return buildSuccess(null, undefined, 204);
    } catch (error) {
      return toErrorResponse(error, 'Failed to delete gallery');
    }
  }

  // --- albums ---
  static async addAlbum(studioId: string, galleryId: number, title: string, sortOrder = 0): Promise<ApiResponse> {
    try {
      const g = await GalleryRepository.findScoped(studioId, galleryId);
      if (!g) return buildError('Gallery not found', 404);
      const a = await AlbumRepository.create(studioId, galleryId, title, sortOrder);
      logger.info({ studioId, galleryId, albumId: a.id }, 'Album added');
      return buildSuccess(sanitizeAlbum(a), undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to add album');
    }
  }

  static async updateAlbum(studioId: string, id: number, patch: { title?: string; sortOrder?: number }): Promise<ApiResponse> {
    try {
      const [affected] = await AlbumRepository.update(studioId, id, patch);
      if (!affected) return buildError('Album not found', 404);
      logger.info({ studioId, albumId: id }, 'Album updated');
      return buildSuccess({ id, ...patch });
    } catch (error) {
      return toErrorResponse(error, 'Failed to update album');
    }
  }

  static async removeAlbum(studioId: string, id: number): Promise<ApiResponse> {
    try {
      const affected = await AlbumRepository.deleteScoped(studioId, id);
      if (!affected) return buildError('Album not found', 404);
      logger.info({ studioId, albumId: id }, 'Album deleted');
      return buildSuccess(null, undefined, 204);
    } catch (error) {
      return toErrorResponse(error, 'Failed to delete album');
    }
  }

  // --- photos: two-phase upload ---
  static async presign(studioId: string, galleryId: number, items: Array<{
    filename: string; mimeType: string; byteSize: number; albumId?: number;
  }>): Promise<ApiResponse> {
    try {
      const g = await GalleryRepository.findScoped(studioId, galleryId);
      if (!g) return buildError('Gallery not found', 404);

      // Guardrails per item — reject rather than surprise the studio later.
      for (const it of items) {
        if (!ALLOWED_MIME.has(it.mimeType)) return buildError(`Unsupported mime ${it.mimeType}`, 400);
        if (it.byteSize > MAX_UPLOAD_BYTES) return buildError(`File exceeds ${MAX_UPLOAD_BYTES} bytes`, 400);
      }

      // Photo.id is auto-increment, so it doesn't exist until the row is
      // inserted — create draft rows with a throwaway key first, then rebuild
      // the deterministic key from each row's real id and persist it. Relies
      // on bulkCreate's RETURNING preserving input order (true for a single
      // multi-row INSERT on Postgres).
      const created = await PhotoRepository.bulkCreate(items.map((it) => ({
        studioId,
        galleryId,
        albumId: it.albumId ?? null,
        s3Key: `pending/${randomBytes(16).toString('hex')}`,
        originalFilename: it.filename,
        mimeType: it.mimeType,
        byteSize: it.byteSize,
        isUploaded: false,
      })) as PhotoCreationAttributes[]);

      const uploads = await Promise.all(
        created.map(async (photo, idx) => {
          const it = items[idx];
          const ext = it.filename.includes('.') ? it.filename.split('.').pop()! : 'jpg';
          const s3Key = buildOriginalKey(studioId, galleryId, photo.id, ext);
          await PhotoRepository.update(studioId, photo.id, { s3Key });
          return {
            photoId: photo.id,
            uploadUrl: await presignPut(s3Key, it.mimeType, it.byteSize),
            s3Key,
          };
        })
      );
      logger.info({ studioId, galleryId, count: uploads.length }, 'Photo uploads presigned');
      return buildSuccess({ uploads });
    } catch (error) {
      return toErrorResponse(error, 'Failed to presign uploads');
    }
  }

  static async confirm(studioId: string, galleryId: number, photoIds: number[]): Promise<ApiResponse> {
    try {
      if (!photoIds.length) return buildSuccess({ confirmed: 0 });
      const [affected] = await PhotoRepository.confirmScoped(studioId, photoIds);
      // Enqueue thumbnail generation. A worker (separate process) picks these up.
      await Promise.all(
        photoIds.map((photoId) =>
          JobRepository.enqueue(studioId, 'thumbnail_generate', { photoId, galleryId })
        )
      );
      logger.info({ studioId, galleryId, confirmed: affected }, 'Photo uploads confirmed');
      return buildSuccess({ confirmed: affected });
    } catch (error) {
      return toErrorResponse(error, 'Failed to confirm uploads');
    }
  }

  static async removePhoto(studioId: string, photoId: number): Promise<ApiResponse> {
    try {
      const p = await PhotoRepository.findScoped(studioId, photoId);
      if (!p) return buildError('Photo not found', 404);
      // Best-effort S3 cleanup; the DB row is the source of truth so a failed
      // S3 delete only leaks bytes, not correctness.
      try {
        await deleteObjects([p.s3Key, ...(p.s3ThumbKey ? [p.s3ThumbKey] : [])]);
      } catch (err) {
        logger.warn({ photoId, err: err instanceof Error ? err.message : err }, 'S3 delete failed');
      }
      await PhotoRepository.softDeleteScoped(studioId, photoId);
      logger.info({ studioId, photoId }, 'Photo deleted');
      return buildSuccess(null, undefined, 204);
    } catch (error) {
      return toErrorResponse(error, 'Failed to delete photo');
    }
  }

  // --- public: password gate + view ---
  static async verifyPassword(slug: string, password: string): Promise<ApiResponse> {
    try {
      const g = await GalleryRepository.findBySlug(slug);
      if (!g) return buildError('Gallery not found', 404);
      const inactive = assertActive(g);
      if (inactive) return buildError(inactive, 404);
      if (!g.passwordHash) return buildSuccess({ token: signGalleryAccess({ galleryId: g.id, slug: g.slug }) });
      const okPass = await bcrypt.compare(password, g.passwordHash);
      if (!okPass) return buildError('Incorrect password', 401);
      return buildSuccess({ token: signGalleryAccess({ galleryId: g.id, slug: g.slug }) });
    } catch (error) {
      return toErrorResponse(error, 'Failed to verify password');
    }
  }

  static async publicView(slug: string, accessToken: string | undefined, clientIdentifier: string | undefined): Promise<ApiResponse> {
    try {
      const g = await GalleryRepository.findBySlug(slug);
      if (!g) return buildError('Gallery not found', 404);
      const inactive = assertActive(g);
      if (inactive) return buildError(inactive, 404);
      if (g.passwordHash) {
        if (!accessToken) return buildError('Gallery is password-protected', 401);
        verifyGalleryAccess(accessToken, g.id);
      }

      // Public read → only surfaces uploaded photos.
      const [albums, photos] = await Promise.all([
        AlbumRepository.listForGallery(g.studioId, g.id),
        PhotoRepository.listForGallery(g.studioId, g.id, true),
      ]);
      const favIds = clientIdentifier
        ? new Set((await FavoriteRepository.listForClient(g.id, clientIdentifier)).map((f) => f.photoId))
        : new Set<number>();

      // Fire-and-forget view increment; a failure here shouldn't block the client.
      GalleryRepository.incrementView(g.id).catch(() => undefined);

      return buildSuccess({
        gallery: {
          id: g.id, slug: g.slug, title: g.title, coverPhotoId: g.coverPhotoId,
          expiresAt: g.expiresAt,
        },
        albums: albums.map(sanitizeAlbum),
        photos: await Promise.all(
          photos.map(async (p) => ({
            ...(await sanitizePhoto(p, true)),
            isFavorite: favIds.has(p.id),
          }))
        ),
      });
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve gallery');
    }
  }

  static async favorite(slug: string, photoId: number, clientIdentifier: string): Promise<ApiResponse> {
    try {
      const g = await GalleryRepository.findBySlug(slug);
      if (!g) return buildError('Gallery not found', 404);
      const inactive = assertActive(g);
      if (inactive) return buildError(inactive, 404);
      await FavoriteRepository.addFavorite(g.studioId, g.id, photoId, clientIdentifier);
      return buildSuccess({ ok: true });
    } catch (error) {
      return toErrorResponse(error, 'Failed to favorite photo');
    }
  }

  static async unfavorite(slug: string, photoId: number, clientIdentifier: string): Promise<ApiResponse> {
    try {
      const g = await GalleryRepository.findBySlug(slug);
      if (!g) return buildError('Gallery not found', 404);
      await FavoriteRepository.removeFavorite(photoId, clientIdentifier);
      return buildSuccess({ ok: true });
    } catch (error) {
      return toErrorResponse(error, 'Failed to unfavorite photo');
    }
  }
}
