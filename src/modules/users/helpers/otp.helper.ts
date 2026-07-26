import crypto from 'crypto';
import { hash, compare } from './password.helper';

// Fallback OTP path (OTPless is primary). 6-digit numeric code.
export const generateOtp = (): string => String(crypto.randomInt(100000, 1000000));

export const hashOtp = (code: string): Promise<string> => hash(code);
export const verifyOtp = (code: string, hashed: string): Promise<boolean> => compare(code, hashed);

export const otpExpiry = (minutes = 10): Date => new Date(Date.now() + minutes * 60_000);
