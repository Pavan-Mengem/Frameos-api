import { Router, Request, Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { authenticate } from '../../../middleware/authenticate';
import { sendResponse } from '../../../utils/response';

const router = Router();

router.use(authenticate);

router.get('/dashboard/overview', async (req: Request, res: Response) => {
  const result = await DashboardService.overview(req.user.studioId);
  sendResponse(res, result);
});

export default router;
