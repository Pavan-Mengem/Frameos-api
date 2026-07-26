import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { LeadService } from '../services/leadService';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { PortfolioEnquiryDTO } from '../dtos/leadDTO';

const router = Router();

// Stricter limiter for the anonymous portfolio enquiry endpoint (spam target).
const portfolioEnquiryRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post(
  '/public/studios/:slug/enquiry',
  portfolioEnquiryRateLimit,
  validateDto(PortfolioEnquiryDTO),
  async (req: Request, res: Response) => {
    const result = await LeadService.captureFromPortfolio(req.params.slug, req.body);
    sendResponse(res, result);
  }
);

export default router;
