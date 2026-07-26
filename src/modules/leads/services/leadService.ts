import { ApiResponse, buildError, buildSuccess } from '../../../utils/response';
import { toErrorResponse } from '../../../utils/errorHandler';
import { buildListResponse } from '../../../utils/pagination';
import { BuiltQuery } from '../../../utils/queryBuilder';
import { StudioRepository } from '../../studios';
import { ClientService } from '../../clients';
import { LeadRepository, CreateLeadInput, UpdateLeadInput } from '../repositories/leadRepository';
import { LeadStatus } from '../models/leadModel';

// Legal status transitions. Reject anything else at the boundary.
const ALLOWED: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted', 'lost'],
  contacted: ['quoted', 'lost'],
  quoted: ['won', 'lost'],
  won: [], // terminal — creates an event
  lost: [], // terminal
};

export class LeadService {
  static async create(studioId: string, dto: CreateLeadInput): Promise<ApiResponse> {
    try {
      const lead = await LeadRepository.create(studioId, dto);
      return buildSuccess(lead, undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to create lead');
    }
  }

  static async list(studioId: string, query: BuiltQuery): Promise<ApiResponse> {
    try {
      const { rows, count } = await LeadRepository.findAndCountAllScoped(studioId, query);
      return buildListResponse(rows, count, query.page);
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve leads');
    }
  }

  static async get(studioId: string, id: string): Promise<ApiResponse> {
    try {
      const lead = await LeadRepository.findByIdScoped(studioId, id);
      if (!lead) return buildError('Lead not found', 404);
      return buildSuccess(lead);
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve lead');
    }
  }

  static async update(studioId: string, id: string, patch: UpdateLeadInput): Promise<ApiResponse> {
    try {
      const updated = await LeadRepository.updateScoped(studioId, id, patch);
      if (!updated) return buildError('Lead not found', 404);
      return buildSuccess(updated);
    } catch (error) {
      return toErrorResponse(error, 'Failed to update lead');
    }
  }

  static async setStatus(studioId: string, id: string, next: LeadStatus): Promise<ApiResponse> {
    try {
      const lead = await LeadRepository.findByIdScoped(studioId, id);
      if (!lead) return buildError('Lead not found', 404);
      if (lead.status === next) return buildSuccess(lead);
      if (!ALLOWED[lead.status as LeadStatus].includes(next)) {
        return buildError(`Illegal transition ${lead.status} → ${next}`, 400);
      }

      // Auto-materialize a client when a lead is won so downstream event/quotation
      // has a client_id to bind. Doesn't create an event — that stays explicit.
      let clientId = lead.clientId;
      if (next === 'won' && !clientId) {
        const c = await ClientService.findOrCreate(studioId, {
          name: lead.name,
          phone: lead.phone,
          email: lead.email,
        });
        clientId = c.id;
      }
      const updated = await LeadRepository.updateScoped(studioId, id, { status: next, clientId });
      return buildSuccess(updated);
    } catch (error) {
      return toErrorResponse(error, 'Failed to update lead status');
    }
  }

  static async remove(studioId: string, id: string): Promise<ApiResponse> {
    try {
      const affected = await LeadRepository.softDeleteScoped(studioId, id);
      if (!affected) return buildError('Lead not found', 404);
      return buildSuccess(null, undefined, 204);
    } catch (error) {
      return toErrorResponse(error, 'Failed to delete lead');
    }
  }

  /**
   * Public portfolio-enquiry capture: resolves the studio by slug, then creates
   * a lead with source=portfolio. Explicit here (not the auth-gated create) so
   * we can lock its shape and rate-limit it independently.
   */
  static async captureFromPortfolio(
    slug: string,
    dto: { name: string; phone?: string; email?: string; message?: string; eventType?: string; eventDate?: string }
  ): Promise<ApiResponse> {
    try {
      const studio = await StudioRepository.findBySlug(slug);
      if (!studio) return buildError('Studio not found', 404);
      const lead = await LeadRepository.create(studio.id, {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        notes: dto.message,
        eventType: dto.eventType,
        eventDate: dto.eventDate,
        source: 'portfolio',
        status: 'new',
      });
      // Never leak internals to the unauthenticated caller.
      return buildSuccess({ id: lead.id }, undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to submit enquiry');
    }
  }
}
