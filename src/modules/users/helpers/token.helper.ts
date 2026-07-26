import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../../config/env';
import { Role } from '../models/userModel';

export interface AuthClaims {
  userId: string;
  studioId: string;
  role: Role;
}

// Access token: short-lived, verified on every request (no DB hit).
export const signAccessToken = (claims: AuthClaims): string =>
  jwt.sign(claims, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_TTL } as SignOptions);

// Refresh token: long-lived, rotated on use; its hash is stored on the user row.
export const signRefreshToken = (claims: AuthClaims): string =>
  jwt.sign(claims, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_TTL } as SignOptions);

export const verifyAccessToken = (token: string): AuthClaims =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthClaims;

export const verifyRefreshToken = (token: string): AuthClaims =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as AuthClaims;
