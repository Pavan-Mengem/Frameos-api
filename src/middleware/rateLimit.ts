import rateLimit from 'express-rate-limit';

// Global limiter: 100 requests / 15 min / IP.
export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for OTP endpoints: 5 / 15 min / IP.
export const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
});
