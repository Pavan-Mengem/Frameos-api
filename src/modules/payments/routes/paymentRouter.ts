import { Router, Request, Response } from 'express';
import { PaymentService } from '../services/paymentService';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { buildQueryOptions } from '../../../utils/queryBuilder';
import { IdParamDTO } from '../../../utils/paramDTOs';
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

router.get('/:id', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await PaymentService.get(req.user.studioId, id);
  sendResponse(res, result);
});

router.post('/orders', validateDto(CreateOrderDTO), async (req: Request, res: Response) => {
  const result = await PaymentService.createOrder(req.user.studioId, req.body as { eventId: number; kind: Exclude<PaymentKind, 'manual'>; amountInr: number });
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
