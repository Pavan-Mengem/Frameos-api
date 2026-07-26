import { ApiResponse, buildSuccess } from '../../../utils/response';
import { toErrorResponse } from '../../../utils/errorHandler';
import { LeadRepository } from '../../leads';
import { EventRepository } from '../../events';
import { GalleryRepository } from '../../galleries';
import { PaymentRepository } from '../../payments';

/**
 * Dashboard overview. Every count is a scalar aggregation on indexed columns —
 * the whole card fits inside ~5 fast queries. Everything runs in parallel to
 * keep p95 under the 300ms non-functional target.
 */
export class DashboardService {
  static async overview(studioId: string): Promise<ApiResponse> {
    try {
      const now = new Date();

      const [
        leadStatuses,
        overdueLeads,
        upcomingEvents,
        pendingBalance,
        totalGalleries,
        recentPayments,
      ] = await Promise.all([
        LeadRepository.countByStatus(studioId),
        LeadRepository.countOverdue(studioId, now),
        EventRepository.countUpcoming(studioId, now),
        EventRepository.sumPendingBalance(studioId),
        GalleryRepository.countForStudio(studioId),
        PaymentRepository.findAndCountAllScoped(studioId, {
          where: { status: 'paid' },
          order: [['created_at', 'DESC']],
          limit: 5,
          offset: 0,
          page: { page: 1, limit: 5, offset: 0 },
        }),
      ]);

      const byStatus = Object.fromEntries(leadStatuses.map((r) => [r.status, Number(r.count)]));

      return buildSuccess({
        leads: {
          new: byStatus.new ?? 0,
          contacted: byStatus.contacted ?? 0,
          quoted: byStatus.quoted ?? 0,
          won: byStatus.won ?? 0,
          lost: byStatus.lost ?? 0,
          overdueFollowUps: overdueLeads,
        },
        events: {
          upcoming: upcomingEvents,
        },
        money: {
          pendingBalanceInr: pendingBalance,
        },
        galleries: {
          total: totalGalleries,
        },
        recentPayments: recentPayments.rows.map((p) => ({
          id: p.id,
          eventId: p.eventId,
          amountInr: p.amountInr,
          method: p.method,
          capturedAt: p.capturedAt,
          gateway: p.gateway,
        })),
      });
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve dashboard overview');
    }
  }
}
