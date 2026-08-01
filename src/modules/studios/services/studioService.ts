import { ApiResponse, buildError, buildSuccess } from '../../../utils/response';
import { toErrorResponse } from '../../../utils/errorHandler';
import { logger } from '../../../config/logger';
import { StudioRepository } from '../repositories/studioRepository';
import { Studio } from '../models/studioModel';
import { isThemeAllowedForPlan, THEMES } from '../helpers/themeRegistry';
import { GalleryRepository, PhotoRepository } from '../../galleries';
import { readUrl } from '../../galleries/helpers/s3.helper';

/**
 * StudioPublicData — what every portfolio theme renders against. Extended over
 * time; frontend themes read only the fields they need, so additive changes
 * here are safe.
 */
export interface StudioPublicData {
  name: string;
  slug: string;
  theme: string;
  tagline: string | null;
  about: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  waLink: string | null;
  priceInr: number | null;
  socials: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    website?: string;
  };
  packages: Array<{ title: string; priceInr: number; features: string[] }>;
  testimonials: Array<{ author: string; quote: string; rating?: number }>;
  featuredPhotos: Array<{ url: string; alt?: string }>;
}

const readSettings = (s: Studio): Partial<StudioPublicData> => {
  const r = s.settings as Partial<StudioPublicData> | undefined;
  return r ?? {};
};

/** Compose `wa.me` link when only the number is set — one less thing to configure. */
const composeWaLink = (whatsapp: string | null, waLink: string | null): string | null => {
  if (waLink) return waLink;
  if (!whatsapp) return null;
  const digits = whatsapp.replace(/\D/g, '');
  if (!digits) return null;
  return `https://wa.me/${digits}`;
};

const sanitize = (s: Studio) => ({
  id: s.id,
  name: s.name,
  slug: s.slug,
  email: s.email,
  phone: s.phone,
  plan: s.plan,
  gstin: s.gstin,
  theme: s.theme,
  settings: readSettings(s),
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});

export interface UpdateStudioInput {
  name?: string;
  email?: string | null;
  phone?: string | null;
  gstin?: string | null;
  theme?: string;
  settings?: Partial<StudioPublicData>;
}

export class StudioService {
  static async getMe(studioId: string): Promise<ApiResponse> {
    try {
      const s = await StudioRepository.findById(studioId);
      if (!s) return buildError('Studio not found', 404);
      return buildSuccess(sanitize(s));
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve studio');
    }
  }

  /** PATCH /studios/me — updates the studio profile + theme + settings. Rejects premium themes on the Free plan. */
  static async updateMe(studioId: string, dto: UpdateStudioInput): Promise<ApiResponse> {
    try {
      const s = await StudioRepository.findById(studioId);
      if (!s) return buildError('Studio not found', 404);

      if (dto.theme !== undefined && !isThemeAllowedForPlan(dto.theme, s.plan)) {
        return buildError('Selected theme requires the Pro plan', 403);
      }

      const nextSettings = { ...readSettings(s), ...(dto.settings ?? {}) };
      await StudioRepository.update(studioId, {
        name: dto.name ?? s.name,
        email: dto.email === undefined ? s.email : dto.email,
        phone: dto.phone === undefined ? s.phone : dto.phone,
        gstin: dto.gstin === undefined ? s.gstin : dto.gstin,
        theme: dto.theme ?? s.theme,
        settings: nextSettings as Record<string, unknown>,
      });
      logger.info({ studioId }, 'Studio profile updated');
      return StudioService.getMe(studioId);
    } catch (error) {
      return toErrorResponse(error, 'Failed to update studio');
    }
  }

  static listThemes(): ApiResponse {
    return buildSuccess(THEMES);
  }

  /**
   * Public portfolio payload — one endpoint, all themes render from this. We
   * surface the raw studio settings + a short featured-photo set pulled from
   * the studio's most recent active gallery.
   */
  static async getPublic(slug: string): Promise<ApiResponse<StudioPublicData>> {
    try {
      const s = await StudioRepository.findBySlug(slug);
      if (!s) return buildError('Studio not found', 404);
      const ext = readSettings(s);

      const galleries = await GalleryRepository.findAndCountAllScoped(s.id, {
        where: { isActive: true },
        order: [['created_at', 'DESC']],
        limit: 1,
        offset: 0,
        page: { page: 1, limit: 1, offset: 0 },
      });
      let featured: StudioPublicData['featuredPhotos'] = [];
      if (galleries.rows[0]) {
        const photos = await PhotoRepository.listForGallery(s.id, galleries.rows[0].id, true);
        featured = await Promise.all(
          photos.slice(0, 12).map(async (p) => ({
            url: await readUrl(p.s3ThumbKey ?? p.s3Key),
            alt: p.originalFilename ?? undefined,
          }))
        );
      }

      const whatsapp = ext.whatsapp ?? s.phone;
      const payload: StudioPublicData = {
        name: s.name,
        slug: s.slug,
        theme: s.theme,
        tagline: ext.tagline ?? null,
        about: ext.about ?? null,
        address: ext.address ?? null,
        email: s.email,
        phone: s.phone,
        whatsapp,
        waLink: composeWaLink(whatsapp, ext.waLink ?? null),
        priceInr: ext.priceInr ?? null,
        socials: ext.socials ?? {},
        packages: ext.packages ?? [],
        testimonials: ext.testimonials ?? [],
        featuredPhotos: featured,
      };
      return buildSuccess(payload);
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve studio portfolio');
    }
  }
}
