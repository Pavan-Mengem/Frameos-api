/** Shared guardrails for direct-to-S3 image uploads (gallery photos, studio branding). */
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB
export const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic']);
