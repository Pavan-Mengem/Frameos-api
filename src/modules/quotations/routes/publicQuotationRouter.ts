import { Router, Request, Response } from 'express';
import { QuotationService } from '../services/quotationService';
import { sendResponse } from '../../../utils/response';

const router = Router();

// Public share view (slug is the capability, not tenant auth).
router.get('/public/quotations/:slug', async (req: Request, res: Response) => {
  const result = await QuotationService.getByShareSlug(req.params.slug);
  if (result.success) res.setHeader('Cache-Control', 'private, max-age=60');
  sendResponse(res, result);
});

export default router;
