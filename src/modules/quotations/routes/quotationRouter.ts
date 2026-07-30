import { Router, Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { QuotationService } from '../services/quotationService';
import { authenticate } from '../../../middleware/authenticate';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { buildQueryOptions } from '../../../utils/queryBuilder';
import { IdParamDTO } from '../../../utils/paramDTOs';
import { CreateQuotationDTO, UpdateQuotationDTO, SetQuotationStatusDTO } from '../dtos/quotationDTO';
import { QuotationStatus } from '../models/quotationModel';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const query = buildQueryOptions(req.query, {
    searchableFields: ['quoteNumber'],
    filterFields: ['status', 'clientId', 'eventId'],
    sortableFields: ['quoteNumber', 'createdAt'],
    defaultSort: [['createdAt', 'DESC']],
  });

  // createdAt range isn't a generic queryBuilder concept — merged in here.
  const { from, to } = req.query;
  if (typeof from === 'string' || typeof to === 'string') {
    const range: WhereOptions = {
      createdAt: {
        ...(typeof from === 'string' ? { [Op.gte]: from } : {}),
        ...(typeof to === 'string' ? { [Op.lte]: to } : {}),
      },
    };
    query.where = Object.keys(query.where).length ? { [Op.and]: [query.where, range] } : range;
  }

  const result = await QuotationService.list(req.user.studioId, query);
  sendResponse(res, result);
});

router.post('/', validateDto(CreateQuotationDTO), async (req: Request, res: Response) => {
  const result = await QuotationService.create(req.user.studioId, req.body);
  sendResponse(res, result);
});

router.get('/:id', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await QuotationService.get(req.user.studioId, id);
  sendResponse(res, result);
});

router.patch('/:id', validateDto(IdParamDTO, 'params'), validateDto(UpdateQuotationDTO), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await QuotationService.update(req.user.studioId, id, req.body);
  sendResponse(res, result);
});

router.post('/:id/send', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await QuotationService.send(req.user.studioId, id);
  sendResponse(res, result);
});

router.patch('/:id/status', validateDto(IdParamDTO, 'params'), validateDto(SetQuotationStatusDTO), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await QuotationService.setStatus(req.user.studioId, id, req.body.status as QuotationStatus);
  sendResponse(res, result);
});

router.delete('/:id', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await QuotationService.remove(req.user.studioId, id);
  sendResponse(res, result);
});

export default router;
