import { TeamAssignment, TeamRole } from '../models/teamAssignmentModel';
import { tenantScope } from '../../../utils/tenantScope';

export class TeamAssignmentRepository {
  static addTeamMember(studioId: string, eventId: number, userId: string, roleOnShoot: TeamRole): Promise<TeamAssignment> {
    return TeamAssignment.create({ studioId, eventId, userId, roleOnShoot });
  }

  static listTeam(studioId: string, eventId: number): Promise<TeamAssignment[]> {
    return TeamAssignment.findAll({ where: tenantScope(studioId, { eventId }) });
  }

  static removeAssignment(studioId: string, id: number): Promise<number> {
    return TeamAssignment.destroy({ where: tenantScope(studioId, { id }) });
  }
}
