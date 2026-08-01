import { env } from '../../../config/env';
import { AuthClaims } from './token.helper';

const isEmail = (identifier: string) => identifier.includes('@');

interface OtplessInitiateResponse {
  requestId: string;
}

interface OtplessVerifyResponse {
  requestId: string;
  isOTPVerified: boolean;
  message?: string;
}

const otplessHeaders = {
  'Content-Type': 'application/json',
  clientId: env.OTPLESS_CLIENT_ID,
  clientSecret: env.OTPLESS_CLIENT_SECRET,
};

/** Sends an OTP via OTPless (SMS or email, inferred from the identifier shape) and returns its requestId. */
export const initiateOtplessOtp = async (identifier: string): Promise<{ requestId: string }> => {
  const body = isEmail(identifier)
    ? { email: identifier, channels: ['EMAIL'], otpLength: 6, expiry: 300 }
    : { phoneNumber: identifier, channels: ['SMS'], otpLength: 6, expiry: 300 };

  const res = await fetch('https://auth.otpless.app/auth/v1/initiate/otp', {
    method: 'POST',
    headers: otplessHeaders,
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error('Failed to send OTP');

  const data = (await res.json()) as OtplessInitiateResponse;
  return { requestId: data.requestId };
};

/** Verifies an OTP against OTPless for a given requestId. */
export const verifyOtplessOtp = async (requestId: string, otp: string): Promise<boolean> => {
  const res = await fetch('https://auth.otpless.app/auth/v1/verify/otp', {
    method: 'POST',
    headers: otplessHeaders,
    body: JSON.stringify({ requestId, otp }),
  });

  if (!res.ok) return false;

  const data = (await res.json()) as OtplessVerifyResponse;
  return data.isOTPVerified;
};

export type { AuthClaims };
