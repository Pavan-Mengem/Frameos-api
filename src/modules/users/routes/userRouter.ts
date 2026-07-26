import { Router, Request, Response } from 'express';
import { UserService } from '../services/userService';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateDto } from '../../../middleware/validateDto';
import { otpRateLimit } from '../../../middleware/rateLimit';
import { sendResponse } from '../../../utils/response';
import { getPagination } from '../../../utils/pagination';
import { RegisterDTO, OtplessDTO, RefreshDTO } from '../dtos/authDTO';
import { AddUserDTO, UpdateStatusDTO } from '../dtos/userDTO';
import { Role } from '../models/userModel';

const router = Router();

// --- public auth ---
router.post('/auth/register', validateDto(RegisterDTO), async (req: Request, res: Response) => {
  sendResponse(res, await UserService.register(req.body));
});

router.post('/auth/verify-otpless', otpRateLimit, validateDto(OtplessDTO), async (req: Request, res: Response) => {
  sendResponse(res, await UserService.loginWithOtpless(req.body.token));
});

router.post('/auth/refresh', validateDto(RefreshDTO), async (req: Request, res: Response) => {
  sendResponse(res, await UserService.refresh(req.body.refreshToken));
});

// --- authenticated ---
router.post('/auth/logout', authenticate, async (req: Request, res: Response) => {
  sendResponse(res, await UserService.logout(req.user.userId));
});

router.get('/auth/me', authenticate, async (req: Request, res: Response) => {
  sendResponse(res, await UserService.me(req.user.userId));
});

// --- team management (owner/admin) ---
router.get('/team', authenticate, async (req: Request, res: Response) => {
  const page = getPagination(req.query);
  const role = typeof req.query.role === 'string' ? (req.query.role as Role) : undefined;
  sendResponse(res, await UserService.listTeam(req.user.studioId, { role }, page));
});

router.post(
  '/team',
  authenticate,
  authorize('owner', 'admin'),
  validateDto(AddUserDTO),
  async (req: Request, res: Response) => {
    sendResponse(res, await UserService.addTeamMember(req.user.studioId, req.body));
  }
);

router.patch(
  '/team/:id/status',
  authenticate,
  authorize('owner', 'admin'),
  validateDto(UpdateStatusDTO),
  async (req: Request, res: Response) => {
    sendResponse(res, await UserService.setMemberStatus(req.user.studioId, req.params.id, req.body.isActive));
  }
);

export default router;
