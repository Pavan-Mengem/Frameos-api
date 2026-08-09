import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/AppError';

export interface ClientPortalClaims {
  clientId: number;
  studioId: string;
}

/** Signed short-lived token proving the caller passed the client's OTP check
 *  for this studio - same precedent as gallery-access.helper.ts's token,
 *  scoped to (clientId, studioId) instead of (galleryId, slug). */
export const signClientPortalAccess = (claims: ClientPortalClaims): string =>
  jwt.sign(claims, env.CLIENT_PORTAL_ACCESS_SECRET, { expiresIn: env.CLIENT_PORTAL_ACCESS_TTL } as jwt.SignOptions);

export const verifyClientPortalAccess = (token: string): ClientPortalClaims => {
  try {
    return jwt.verify(token, env.CLIENT_PORTAL_ACCESS_SECRET) as ClientPortalClaims;
  } catch {
    throw AppError.unauthorized('Portal session invalid or expired');
  }
};
