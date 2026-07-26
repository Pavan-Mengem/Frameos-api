import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../../../config/env';
import { AppError } from '../../../utils/AppError';

let client: Razorpay | null = null;

const getClient = (): Razorpay => {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) {
    throw AppError.badRequest('Razorpay is not configured on this deployment');
  }
  if (!client) {
    client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
  }
  return client;
};

/** Create an order on Razorpay. amountInr is in ₹; converted to paise on the wire. */
export const createOrder = async (params: {
  amountInr: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> => {
  const order = await getClient().orders.create({
    amount: params.amountInr * 100,
    currency: 'INR',
    receipt: params.receipt,
    notes: params.notes,
    payment_capture: true,
  } as never);
  return { id: order.id, amount: Number(order.amount), currency: order.currency };
};

/**
 * Verify the X-Razorpay-Signature header on a webhook. `rawBody` MUST be the
 * exact bytes we received — no re-serialization — because Razorpay signs the
 * raw request body with HMAC-SHA256 and the webhook secret.
 */
export const verifyWebhookSignature = (rawBody: Buffer | string, signature: string): boolean => {
  if (!env.RAZORPAY_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

export const publishableKeyId = (): string => env.RAZORPAY_KEY_ID;
