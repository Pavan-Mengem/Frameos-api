import { Router, Request, Response } from 'express';
import { ClientService } from '../services/clientService';
import { authenticate } from '../../../middleware/authenticate';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { buildQueryOptions } from '../../../utils/queryBuilder';
import { IdParamDTO } from '../../../utils/paramDTOs';
import { CreateClientDTO, UpdateClientDTO } from '../dtos/clientDTO';

const router = Router();

router.use(authenticate); // every route below requires a valid access token

router.get('/', async (req: Request, res: Response) => {
  const query = buildQueryOptions(req.query, {
    searchableFields: ['name', 'phone', 'email'],
    filterFields: ['city', 'source'],
    sortableFields: ['name', 'createdAt'],
    defaultSort: [['createdAt', 'DESC']],
  });
  const result = await ClientService.list(req.user.studioId, query);
  sendResponse(res, result);
});

router.post('/', validateDto(CreateClientDTO), async (req: Request, res: Response) => {
  const result = await ClientService.create(req.user.studioId, req.body);
  sendResponse(res, result);
});

router.get('/:id', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await ClientService.get(req.user.studioId, id);
  sendResponse(res, result);
});

router.patch('/:id', validateDto(IdParamDTO, 'params'), validateDto(UpdateClientDTO), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await ClientService.update(req.user.studioId, id, req.body);
  sendResponse(res, result);
});

router.delete('/:id', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await ClientService.remove(req.user.studioId, id);
  sendResponse(res, result);
});

export default router;
