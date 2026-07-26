import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { sendResponse } from '../../../utils/response';

const router = Router();

// Public; the Razorpay signature IS the auth.
router.post('/webhooks/razorpay', async (req: Request, res: Response) => {
  const raw = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(JSON.stringify(req.body));
  const signature = (req.headers['x-razorpay-signature'] as string) ?? '';
  const result = await PaymentService.handleRazorpayWebhook(raw, signature, req.body);
  sendResponse(res, result);
});

export default router;
