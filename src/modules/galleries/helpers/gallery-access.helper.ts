import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/AppError';

export interface GalleryAccessClaims {
  galleryId: number;
  slug: string;
}

/** Signed short-lived token proving the caller passed the gallery password check. */
export const signGalleryAccess = (claims: GalleryAccessClaims): string =>
  jwt.sign(claims, env.GALLERY_ACCESS_SECRET, { expiresIn: env.GALLERY_ACCESS_TTL } as jwt.SignOptions);

export const verifyGalleryAccess = (token: string, expectedGalleryId: number): GalleryAccessClaims => {
  try {
    const claims = jwt.verify(token, env.GALLERY_ACCESS_SECRET) as GalleryAccessClaims;
    if (claims.galleryId !== expectedGalleryId) throw new Error('gallery mismatch');
    return claims;
  } catch {
    throw AppError.unauthorized('Gallery access token invalid or expired');
  }
};
