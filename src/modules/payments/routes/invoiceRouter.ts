import { Router, Request, Response } from 'express';
import { InvoiceService } from '../services/invoiceService';
import { authenticate } from '../../../middleware/authenticate';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { buildQueryOptions } from '../../../utils/queryBuilder';
import { IdParamDTO } from '../../../utils/paramDTOs';

const router = Router();

router.use(authenticate);

router.get('/invoices', async (req: Request, res: Response) => {
  const query = buildQueryOptions(req.query, {
    filterFields: ['eventId'],
    sortableFields: ['createdAt', 'issuedAt', 'totalInr'],
    defaultSort: [['issuedAt', 'DESC']],
  });
  sendResponse(res, await InvoiceService.list(req.user.studioId, query));
});

router.get('/invoices/:id', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  sendResponse(res, await InvoiceService.get(req.user.studioId, id));
});

router.get('/invoices/:id/pdf', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  await InvoiceService.streamPdf(req.user.studioId, id, res);
});

export default router;
