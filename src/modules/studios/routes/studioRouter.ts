import { Router, Request, Response } from 'express';
import { StudioService } from '../services/studioService';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { UpdateStudioDTO, BrandingPresignDTO } from '../dtos/studioDTO';

const router = Router();

// Paths here don't share a single entity prefix (public portfolio, authenticated
// studio-management, and the theme catalog), so — unlike most modules — routes
// are declared with their full paths directly rather than nested under one prefix.

router.get('/public/studios/:slug', async (req: Request, res: Response) => {
  const result = await StudioService.getPublic(req.params.slug);
  if (result.success) {
    // Cache the portfolio at the CDN for 60s. Themes live in the frontend
    // renderer; this payload only changes when the studio edits it.
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
  }
  sendResponse(res, result);
});

router.get('/studios/me', authenticate, async (req: Request, res: Response) => {
  sendResponse(res, await StudioService.getMe(req.user.studioId));
});

router.patch(
  '/studios/me',
  authenticate,
  authorize('owner', 'admin'),
  validateDto(UpdateStudioDTO),
  async (req: Request, res: Response) => {
    sendResponse(res, await StudioService.updateMe(req.user.studioId, req.body));
  }
);

router.get('/themes', authenticate, async (_req: Request, res: Response) => {
  sendResponse(res, StudioService.listThemes());
});

router.post(
  '/studios/me/branding/presign',
  authenticate,
  authorize('owner', 'admin'),
  validateDto(BrandingPresignDTO),
  async (req: Request, res: Response) => {
    sendResponse(res, await StudioService.presignBranding(req.user.studioId, req.body.kind, req.body.mimeType, req.body.byteSize));
  }
);

export default router;
