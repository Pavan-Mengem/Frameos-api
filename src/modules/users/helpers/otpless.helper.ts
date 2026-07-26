import { AuthClaims } from './token.helper';

/**
 * Verifies an OTPless token and returns the authenticated identifier.
 * Stubbed here — wire to the OTPless verify API (env: OTPLESS_CLIENT_ID/SECRET)
 * in the payments/auth integration phase. Kept isolated so the service layer
 * depends on a stable shape, not the vendor SDK.
 */
export interface OtplessIdentity {
  phone?: string;
  email?: string;
}

export const verifyOtplessToken = async (token: string): Promise<OtplessIdentity> => {
  if (!token) throw new Error('Missing OTPless token');
  // TODO: POST token to OTPless verify endpoint; parse phone/email from response.
  // Placeholder decode to keep the flow runnable in development:
  return { phone: undefined, email: undefined };
};

export type { AuthClaims };
