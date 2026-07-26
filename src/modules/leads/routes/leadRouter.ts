import { Router, Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { LeadService } from '../services/leadService';
import { authenticate } from '../../../middleware/authenticate';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { buildQueryOptions } from '../../../utils/queryBuilder';
import { CreateLeadDTO, UpdateLeadDTO, SetLeadStatusDTO } from '../dtos/leadDTO';
import { LeadStatus } from '../models/leadModel';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const query = buildQueryOptions(req.query, {
    searchableFields: ['name', 'phone', 'email'],
    filterFields: ['status', 'source', 'eventType', 'assignedTo'],
    sortableFields: ['name', 'createdAt', 'eventDate', 'followUpAt'],
    defaultSort: [['createdAt', 'DESC']],
  });

  // eventDate range isn't a generic queryBuilder concept — merged in here.
  const { from, to } = req.query;
  if (typeof from === 'string' || typeof to === 'string') {
    const range: WhereOptions = {
      eventDate: {
        ...(typeof from === 'string' ? { [Op.gte]: from } : {}),
        ...(typeof to === 'string' ? { [Op.lte]: to } : {}),
      },
    };
    query.where = Object.keys(query.where).length ? { [Op.and]: [query.where, range] } : range;
  }

  const result = await LeadService.list(req.user.studioId, query);
  sendResponse(res, result);
});

router.post('/', validateDto(CreateLeadDTO), async (req: Request, res: Response) => {
  const result = await LeadService.create(req.user.studioId, req.body);
  sendResponse(res, result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const result = await LeadService.get(req.user.studioId, req.params.id);
  sendResponse(res, result);
});

router.patch('/:id', validateDto(UpdateLeadDTO), async (req: Request, res: Response) => {
  const result = await LeadService.update(req.user.studioId, req.params.id, req.body);
  sendResponse(res, result);
});

router.patch('/:id/status', validateDto(SetLeadStatusDTO), async (req: Request, res: Response) => {
  const result = await LeadService.setStatus(req.user.studioId, req.params.id, req.body.status as LeadStatus);
  sendResponse(res, result);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const result = await LeadService.remove(req.user.studioId, req.params.id);
  sendResponse(res, result);
});

export default router;
