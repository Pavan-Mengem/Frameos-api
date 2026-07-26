import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AuthClaims } from '../modules/users/helpers/token.helper';
import { AppError } from '../utils/AppError';

// Augment Express Request with request id + authenticated claims.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id: string;
      user: AuthClaims;
    }
  }
}

// Verifies the access token from the Authorization header and attaches claims.
// Trusts signed claims (userId, studioId, role) — no per-request DB load.
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing bearer token'));
  }
  try {
    req.user = verifyAccessToken(header.slice(7));
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
};
