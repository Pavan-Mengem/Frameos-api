import { Router, Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { EventService } from '../services/eventService';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { buildQueryOptions } from '../../../utils/queryBuilder';
import { IdParamDTO } from '../../../utils/paramDTOs';
import { CreateEventDTO, UpdateEventDTO, AddTeamMemberDTO, EventTeamAssignmentParamsDTO } from '../dtos/eventDTO';
import { TeamRole } from '../models/teamAssignmentModel';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const query = buildQueryOptions(req.query, {
    searchableFields: ['title', 'venue'],
    filterFields: ['status', 'clientId'],
    sortableFields: ['title', 'createdAt', 'eventDate'],
    defaultSort: [['eventDate', 'ASC']],
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

  const result = await EventService.list(req.user.studioId, query);
  sendResponse(res, result);
});

router.post('/', validateDto(CreateEventDTO), async (req: Request, res: Response) => {
  const result = await EventService.create(req.user.studioId, req.body);
  sendResponse(res, result);
});

router.get('/:id', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await EventService.getWithDetails(req.user.studioId, id);
  sendResponse(res, result);
});

router.patch('/:id', validateDto(IdParamDTO, 'params'), validateDto(UpdateEventDTO), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await EventService.update(req.user.studioId, id, req.body);
  sendResponse(res, result);
});

router.delete('/:id', authorize('owner', 'admin'), validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await EventService.remove(req.user.studioId, id);
  sendResponse(res, result);
});

router.post(
  '/:id/team',
  authorize('owner', 'admin'),
  validateDto(IdParamDTO, 'params'),
  validateDto(AddTeamMemberDTO),
  async (req: Request, res: Response) => {
    const { id } = req.params as unknown as IdParamDTO;
    const result = await EventService.addTeamMember(
      req.user.studioId,
      id,
      req.body.userId,
      req.body.roleOnShoot as TeamRole
    );
    sendResponse(res, result);
  }
);

router.delete(
  '/:id/team/:assignmentId',
  authorize('owner', 'admin'),
  validateDto(EventTeamAssignmentParamsDTO, 'params'),
  async (req: Request, res: Response) => {
    const { assignmentId } = req.params as unknown as EventTeamAssignmentParamsDTO;
    const result = await EventService.removeTeamMember(req.user.studioId, assignmentId);
    sendResponse(res, result);
  }
);

export default router;
