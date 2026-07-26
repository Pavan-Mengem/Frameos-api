import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { buildQueryOptions } from '../../../utils/queryBuilder';
import { CreateOrderDTO, ManualPaymentDTO } from '../dtos/paymentDTO';
import { PaymentKind } from '../models/paymentModel';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const query = buildQueryOptions(req.query, {
    filterFields: ['eventId', 'kind', 'status'],
    sortableFields: ['createdAt'],
    defaultSort: [['createdAt', 'DESC']],
  });
  const result = await PaymentService.list(req.user.studioId, query);
  sendResponse(res, result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const result = await PaymentService.get(req.user.studioId, req.params.id);
  sendResponse(res, result);
});

router.post('/orders', validateDto(CreateOrderDTO), async (req: Request, res: Response) => {
  const result = await PaymentService.createOrder(req.user.studioId, req.body as { eventId: string; kind: Exclude<PaymentKind, 'manual'>; amountInr: number });
  sendResponse(res, result);
});

router.post(
  '/manual',
  authorize('owner', 'admin'),
  validateDto(ManualPaymentDTO),
  async (req: Request, res: Response) => {
    const result = await PaymentService.recordManual(req.user.studioId, req.body);
    sendResponse(res, result);
  }
);

export default router;
