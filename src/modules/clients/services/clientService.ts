import { ApiResponse, buildError, buildSuccess } from '../../../utils/response';
import { toErrorResponse } from '../../../utils/errorHandler';
import { buildListResponse } from '../../../utils/pagination';
import { BuiltQuery } from '../../../utils/queryBuilder';
import { logger } from '../../../config/logger';
import { AppError } from '../../../utils/AppError';
import { ClientRepository, CreateClientInput, UpdateClientInput } from '../repositories/clientRepository';
import { Client } from '../models/clientModel';

/**
 * Business logic + repository orchestration for Client. Every method's first
 * argument is `studioId` (frameos's tenancy convention). Never throws; always
 * returns ApiResponse via buildSuccess/buildError.
 */
export class ClientService {
  static async list(studioId: string, query: BuiltQuery): Promise<ApiResponse> {
    try {
      const { rows, count } = await ClientRepository.findAndCountAllScoped(studioId, query);
      return buildListResponse(rows, count, query.page);
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve clients');
    }
  }

  static async get(studioId: string, id: number): Promise<ApiResponse> {
    try {
      const client = await ClientRepository.findByIdScoped(studioId, id);
      if (!client) return buildError('Client not found', 404);
      return buildSuccess(client);
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve client');
    }
  }

  static async create(studioId: string, dto: CreateClientInput): Promise<ApiResponse> {
    try {
      if (dto.phone) {
        const existing = await ClientRepository.findByPhoneScoped(studioId, dto.phone);
        if (existing) return buildError('A client with this phone already exists', 409);
      }
      const client = await ClientRepository.create(studioId, dto);
      logger.info({ studioId, clientId: client.id }, 'Client created');
      return buildSuccess(client, undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to create client');
    }
  }

  static async update(studioId: string, id: number, dto: UpdateClientInput): Promise<ApiResponse> {
    try {
      const updated = await ClientRepository.updateScoped(studioId, id, dto);
      if (!updated) return buildError('Client not found', 404);
      return buildSuccess(updated);
    } catch (error) {
      return toErrorResponse(error, 'Failed to update client');
    }
  }

  static async remove(studioId: string, id: number): Promise<ApiResponse> {
    try {
      const affected = await ClientRepository.softDeleteScoped(studioId, id);
      if (!affected) return buildError('Client not found', 404);
      return buildSuccess(null, undefined, 204);
    } catch (error) {
      return toErrorResponse(error, 'Failed to delete client');
    }
  }

  /**
   * Internal-only (not an HTTP endpoint): verifies a client exists within the
   * studio, throwing like the pre-restructuring service layer did. Other
   * not-yet-converted modules (events, quotations) use this to confirm a
   * clientId belongs to the caller's studio before proceeding.
   */
  static async getScoped(studioId: string, id: number): Promise<Client> {
    const client = await ClientRepository.findByIdScoped(studioId, id);
    if (!client) throw AppError.notFound('Client not found');
    return client;
  }

  /**
   * Used internally by other modules (leads, events) to find-or-create a client
   * from a phone/name pair without exposing the create endpoint. Not itself an
   * HTTP endpoint, so it returns the raw model rather than an ApiResponse.
   */
  static async findOrCreate(studioId: string, seed: { name: string; phone?: string | null; email?: string | null }): Promise<Client> {
    if (seed.phone) {
      const existing = await ClientRepository.findByPhoneScoped(studioId, seed.phone);
      if (existing) return existing;
    }
    return ClientRepository.create(studioId, seed);
  }
}
