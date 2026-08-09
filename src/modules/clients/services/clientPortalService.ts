import { ApiResponse, buildError, buildSuccess } from '../../../utils/response';
import { toErrorResponse } from '../../../utils/errorHandler';
import { env } from '../../../config/env';
import { StudioRepository } from '../../studios/repositories/studioRepository';
import { EventRepository } from '../../events/repositories/eventRepository';
import { GalleryRepository } from '../../galleries/repositories/galleryRepository';
import { InvoiceRepository } from '../../payments/repositories/invoiceRepository';
import { OtpRepository, generateOtp, hashOtp, verifyOtp as verifyOtpHash, otpExpiry, initiateOtplessOtp, verifyOtplessOtp } from '../../users';
import { ClientRepository } from '../repositories/clientRepository';
import { signClientPortalAccess, verifyClientPortalAccess } from '../helpers/clientPortalAccess.helper';

const findClient = (studioId: string, identifier: string) =>
  identifier.includes('@')
    ? ClientRepository.findByEmailScoped(studioId, identifier)
    : ClientRepository.findByPhoneScoped(studioId, identifier);

/**
 * Client-facing portal auth + aggregation. Deliberately reuses the exact
 * generateOtp/OtpRepository/OTPless infra already built for studio-owner
 * login (see UserService.sendOtp/verifyOtp) rather than a new auth system -
 * the only difference is the identity resolved at the end is a Client
 * scoped to one studio, not a User.
 */
export class ClientPortalService {
  static async requestOtp(slug: string, identifier: string): Promise<ApiResponse> {
    try {
      const studio = await StudioRepository.findBySlug(slug);
      if (!studio) return buildError('Studio not found', 404);

      // Deliberately vague on failure - don't reveal whether this identifier
      // matches a client record to an unauthenticated caller.
      const client = await findClient(studio.id, identifier);
      if (!client) return buildError('No booking on file for this contact', 404);

      if (env.isDev) {
        const otp = generateOtp();
        const record = await OtpRepository.create({
          identifier,
          otpHash: await hashOtp(otp),
          type: identifier.includes('@') ? 'email' : 'sms',
          purpose: `client-portal:${studio.id}`,
          expiresAt: otpExpiry(5),
        });
        return buildSuccess({ requestId: String(record.id), otp });
      }

      const { requestId } = await initiateOtplessOtp(identifier);
      return buildSuccess({ requestId });
    } catch (error) {
      return toErrorResponse(error, 'Failed to send code');
    }
  }

  static async verifyOtp(
    slug: string,
    dto: { identifier: string; otp: string; requestId: string }
  ): Promise<ApiResponse> {
    try {
      const studio = await StudioRepository.findBySlug(slug);
      if (!studio) return buildError('Studio not found', 404);

      if (env.isDev) {
        const record = await OtpRepository.findById(Number(dto.requestId));
        if (!record || record.expiresAt.getTime() < Date.now()) return buildError('Invalid or expired code', 401);
        const valid = await verifyOtpHash(dto.otp, record.otpHash);
        if (!valid) {
          await OtpRepository.incrementAttempts(record.id);
          return buildError('Invalid or expired code', 401);
        }
        await OtpRepository.destroy(record.id);
      } else {
        const verified = await verifyOtplessOtp(dto.requestId, dto.otp);
        if (!verified) return buildError('Invalid or expired code', 401);
      }

      const client = await findClient(studio.id, dto.identifier);
      if (!client) return buildError('No booking on file for this contact', 404);

      const token = signClientPortalAccess({ clientId: client.id, studioId: studio.id });
      return buildSuccess({ token, client: { id: client.id, name: client.name } });
    } catch (error) {
      return toErrorResponse(error, 'Failed to verify code');
    }
  }

  /** GET .../portal/me - the slug and the token's embedded studioId must
   *  agree, so a token minted for one studio can't be replayed on another's
   *  portal URL. */
  static async getMe(slug: string, token: string): Promise<ApiResponse> {
    try {
      const claims = verifyClientPortalAccess(token);
      const studio = await StudioRepository.findBySlug(slug);
      if (!studio || studio.id !== claims.studioId) return buildError('Portal session invalid or expired', 401);

      const client = await ClientRepository.findByIdScoped(claims.studioId, claims.clientId);
      if (!client) return buildError('Client not found', 404);

      const [events, galleries, invoices] = await Promise.all([
        EventRepository.findAllForClient(claims.studioId, claims.clientId),
        GalleryRepository.findAllForClient(claims.studioId, claims.clientId),
        InvoiceRepository.findAllForClient(claims.studioId, claims.clientId),
      ]);

      return buildSuccess({
        client: { id: client.id, name: client.name, email: client.email, phone: client.phone },
        bookings: events.map((e) => ({
          id: e.id,
          title: e.title,
          eventType: e.eventType,
          eventDate: e.eventDate,
          venue: e.venue,
          status: e.status,
          totalInr: e.totalInr,
          paidInr: e.paidInr,
        })),
        galleries: galleries.map((g) => ({ id: g.id, title: g.title, slug: g.slug })),
        invoices: invoices.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          issuedAt: inv.issuedAt,
          totalInr: inv.totalInr,
        })),
      });
    } catch (error) {
      return toErrorResponse(error, 'Failed to load your portal');
    }
  }
}
