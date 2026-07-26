import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { GalleryService } from '../services/galleryService';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { PasswordDTO, FavoriteDTO } from '../dtos/galleryDTO';

const router = Router();

// Anonymous endpoints — tighter limiter to blunt brute-force / bot traffic.
const publicLimiter = rateLimit({ windowMs: 60_000, max: 30, standardHeaders: true, legacyHeaders: false });
const passwordLimiter = rateLimit({ windowMs: 60_000, max: 10, standardHeaders: true, legacyHeaders: false });

router.post('/public/galleries/:slug/access', passwordLimiter, validateDto(PasswordDTO), async (req: Request, res: Response) => {
  const result = await GalleryService.verifyPassword(req.params.slug, req.body.password);
  sendResponse(res, result);
});

router.get('/public/galleries/:slug', publicLimiter, async (req: Request, res: Response) => {
  const accessToken = (req.headers['x-gallery-access'] as string) ?? (req.query.token as string);
  const clientIdentifier = (req.headers['x-client-id'] as string) ?? (req.query.cid as string);
  const result = await GalleryService.publicView(req.params.slug, accessToken, clientIdentifier);
  if (result.success) res.setHeader('Cache-Control', 'public, max-age=30');
  sendResponse(res, result);
});

router.post('/public/galleries/:slug/favorites', publicLimiter, validateDto(FavoriteDTO), async (req: Request, res: Response) => {
  const result = await GalleryService.favorite(req.params.slug, req.body.photoId, req.body.clientIdentifier);
  sendResponse(res, result);
});

router.delete('/public/galleries/:slug/favorites', publicLimiter, validateDto(FavoriteDTO), async (req: Request, res: Response) => {
  const result = await GalleryService.unfavorite(req.params.slug, req.body.photoId, req.body.clientIdentifier);
  sendResponse(res, result);
});

export default router;
