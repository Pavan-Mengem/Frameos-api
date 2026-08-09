import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { ClientPortalService } from '../services/clientPortalService';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { PortalOtpRequestDTO, PortalOtpVerifyDTO } from '../dtos/portalDTO';

const router = Router();

// Anonymous endpoints — tighter limiter to blunt brute-force / bot traffic,
// same precedent as publicGalleryRouter.ts's publicLimiter/passwordLimiter.
const otpLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });
const publicLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false });

router.post(
  '/public/studios/:slug/portal/otp',
  otpLimiter,
  validateDto(PortalOtpRequestDTO),
  async (req: Request, res: Response) => {
    sendResponse(res, await ClientPortalService.requestOtp(req.params.slug, req.body.identifier));
  }
);

router.post(
  '/public/studios/:slug/portal/otp/verify',
  otpLimiter,
  validateDto(PortalOtpVerifyDTO),
  async (req: Request, res: Response) => {
    sendResponse(res, await ClientPortalService.verifyOtp(req.params.slug, req.body));
  }
);

router.get('/public/studios/:slug/portal/me', publicLimiter, async (req: Request, res: Response) => {
  const token = (req.headers['x-portal-access'] as string) ?? (req.query.token as string) ?? '';
  sendResponse(res, await ClientPortalService.getMe(req.params.slug, token));
});

export default router;
