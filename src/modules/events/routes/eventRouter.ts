import { Router, Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { EventService } from '../services/eventService';
import { authenticate } from '../../../middleware/authenticate';
import { authorize } from '../../../middleware/authorize';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { buildQueryOptions } from '../../../utils/queryBuilder';
import { CreateEventDTO, UpdateEventDTO, AddTeamMemberDTO } from '../dtos/eventDTO';
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

router.get('/:id', async (req: Request, res: Response) => {
  const result = await EventService.getWithDetails(req.user.studioId, req.params.id);
  sendResponse(res, result);
});

router.patch('/:id', validateDto(UpdateEventDTO), async (req: Request, res: Response) => {
  const result = await EventService.update(req.user.studioId, req.params.id, req.body);
  sendResponse(res, result);
});

router.delete('/:id', authorize('owner', 'admin'), async (req: Request, res: Response) => {
  const result = await EventService.remove(req.user.studioId, req.params.id);
  sendResponse(res, result);
});

router.post(
  '/:id/team',
  authorize('owner', 'admin'),
  validateDto(AddTeamMemberDTO),
  async (req: Request, res: Response) => {
    const result = await EventService.addTeamMember(
      req.user.studioId,
      req.params.id,
      req.body.userId,
      req.body.roleOnShoot as TeamRole
    );
    sendResponse(res, result);
  }
);

router.delete('/:id/team/:assignmentId', authorize('owner', 'admin'), async (req: Request, res: Response) => {
  const result = await EventService.removeTeamMember(req.user.studioId, req.params.assignmentId);
  sendResponse(res, result);
});

export default router;
