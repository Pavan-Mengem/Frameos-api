import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  APP_PUBLIC_URL: z.string().default('http://localhost:3000'), // portfolio base for share links

  // --- Database ---
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.coerce.number().default(5432),
  DB_NAME: z.string().default('frameos_db'),
  DB_USER: z.string().default('postgres'),
  DB_PASSWORD: z.string().default('postgres'),
  DB_AUTO_SYNC: z.enum(['true', 'false']).default('true'), // dev only; ignored in prod

  // --- JWT ---
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // --- OTPless ---
  OTPLESS_CLIENT_ID: z.string().optional().default(''),
  OTPLESS_CLIENT_SECRET: z.string().optional().default(''),

  // --- S3 / CDN (galleries) ---
  S3_REGION: z.string().default('ap-south-1'),
  S3_BUCKET: z.string().default(''),
  S3_ACCESS_KEY_ID: z.string().default(''),
  S3_SECRET_ACCESS_KEY: z.string().default(''),
  S3_PUBLIC_BASE_URL: z.string().default(''), // CDN base for serving; empty falls back to bucket URL
  S3_PRESIGN_EXPIRES: z.coerce.number().default(900), // seconds

  // --- Gallery access tokens (password-protected gallery links) ---
  GALLERY_ACCESS_SECRET: z.string().default('dev-gallery-access-secret'),
  GALLERY_ACCESS_TTL: z.string().default('24h'),

  // --- Razorpay ---
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // Fail fast on misconfiguration rather than at first request.
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(',').map((s) => s.trim()),
};
