import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/AppError';

let client: S3Client | null = null;

const s3 = (): S3Client => {
  if (!env.S3_BUCKET) throw AppError.badRequest('S3 is not configured on this deployment');
  if (!client) {
    client = new S3Client({
      region: env.S3_REGION,
      credentials: env.S3_ACCESS_KEY_ID
        ? { accessKeyId: env.S3_ACCESS_KEY_ID, secretAccessKey: env.S3_SECRET_ACCESS_KEY }
        : undefined, // fall back to IAM role / env credentials chain in prod
    });
  }
  return client;
};

/** Presign a PUT URL for a direct browser→S3 upload. Enforces content-type + size. */
export const presignPut = async (key: string, contentType: string, maxBytes: number) => {
  const url = await getSignedUrl(
    s3(),
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: maxBytes, // hint; browser must send matching Content-Length
      ServerSideEncryption: 'AES256',
    }),
    { expiresIn: env.S3_PRESIGN_EXPIRES }
  );
  return url;
};

/**
 * Best URL for a public read.
 *  - S3_PUBLIC_BASE_URL set → cheap, cached, unsigned CDN URL (bucket policy allows read via CDN OAI).
 *  - Otherwise → signed S3 GET URL, short-lived; ties the URL to the requester's session.
 */
export const readUrl = async (key: string): Promise<string> => {
  if (env.S3_PUBLIC_BASE_URL) return `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: key }),
    { expiresIn: env.S3_PRESIGN_EXPIRES }
  );
};

export const deleteObjects = async (keys: string[]) => {
  if (!keys.length) return;
  await s3().send(
    new DeleteObjectsCommand({
      Bucket: env.S3_BUCKET,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    })
  );
};

/** Deterministic S3 key so redelivery of the same photoId can't collide. */
export const buildOriginalKey = (studioId: string, galleryId: number, photoId: number, ext: string) =>
  `originals/${studioId}/${galleryId}/${photoId}${ext ? `.${ext.replace(/^\./, '')}` : ''}`;
