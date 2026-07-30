import { ApiResponse, buildError, buildSuccess } from '../../../utils/response';
import { toErrorResponse } from '../../../utils/errorHandler';
import { buildListResponse } from '../../../utils/pagination';
import { BuiltQuery } from '../../../utils/queryBuilder';
import { ClientService } from '../../clients';
import { EventRepository, CreateEventInput, UpdateEventInput } from '../repositories/eventRepository';
import { TeamAssignmentRepository } from '../repositories/teamAssignmentRepository';
import { Event, EventAttributes } from '../models/eventModel';
import { TeamRole } from '../models/teamAssignmentModel';

// balanceInr is derived, not stored — computed the same way on every response.
const withBalance = (e: Event) => ({
  ...(e.get({ plain: true }) as EventAttributes),
  balanceInr: Math.max(0, (e.totalInr ?? 0) - (e.paidInr ?? 0)),
});

export class EventService {
  static async create(studioId: string, dto: CreateEventInput): Promise<ApiResponse> {
    try {
      // Verify client belongs to this studio (structural — getScoped throws 404 otherwise)
      await ClientService.getScoped(studioId, dto.clientId);
      const ev = await EventRepository.create(studioId, dto);
      return buildSuccess(withBalance(ev), undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to create event');
    }
  }

  static async list(studioId: string, query: BuiltQuery): Promise<ApiResponse> {
    try {
      const { rows, count } = await EventRepository.findAndCountAllScoped(studioId, query);
      return buildListResponse(rows.map(withBalance), count, query.page);
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve events');
    }
  }

  static async getWithDetails(studioId: string, id: number): Promise<ApiResponse> {
    try {
      const ev = await EventRepository.findByIdScoped(studioId, id);
      if (!ev) return buildError('Event not found', 404);
      const team = await TeamAssignmentRepository.listTeam(studioId, id);
      return buildSuccess({ ...withBalance(ev), team });
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve event');
    }
  }

  static async update(studioId: string, id: number, patch: UpdateEventInput): Promise<ApiResponse> {
    try {
      const updated = await EventRepository.updateScoped(studioId, id, patch);
      if (!updated) return buildError('Event not found', 404);
      return buildSuccess(withBalance(updated));
    } catch (error) {
      return toErrorResponse(error, 'Failed to update event');
    }
  }

  static async remove(studioId: string, id: number): Promise<ApiResponse> {
    try {
      const affected = await EventRepository.softDeleteScoped(studioId, id);
      if (!affected) return buildError('Event not found', 404);
      return buildSuccess(null, undefined, 204);
    } catch (error) {
      return toErrorResponse(error, 'Failed to delete event');
    }
  }

  // --- team ---
  static async addTeamMember(studioId: string, eventId: number, userId: string, roleOnShoot: TeamRole): Promise<ApiResponse> {
    try {
      const ev = await EventRepository.findByIdScoped(studioId, eventId); // confirms tenant ownership
      if (!ev) return buildError('Event not found', 404);
      const assignment = await TeamAssignmentRepository.addTeamMember(studioId, eventId, userId, roleOnShoot);
      return buildSuccess(assignment, undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to add team member');
    }
  }

  static async removeTeamMember(studioId: string, assignmentId: number): Promise<ApiResponse> {
    try {
      const affected = await TeamAssignmentRepository.removeAssignment(studioId, assignmentId);
      if (!affected) return buildError('Assignment not found', 404);
      return buildSuccess(null, undefined, 204);
    } catch (error) {
      return toErrorResponse(error, 'Failed to remove team member');
    }
  }
}
