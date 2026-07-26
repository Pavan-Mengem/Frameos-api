import { randomBytes } from 'crypto';
import { sequelize } from '../../../config/database';
import { ApiResponse, buildError, buildSuccess } from '../../../utils/response';
import { toErrorResponse } from '../../../utils/errorHandler';
import { buildListResponse } from '../../../utils/pagination';
import { BuiltQuery } from '../../../utils/queryBuilder';
import { StudioRepository } from '../../studios';
import { ClientService } from '../../clients';
import { CounterRepository, formatDocNumber, computeTotals, financialYearCode, GstLineInput } from '../../invoicing';
import { QuotationRepository, CreateQuotationInput } from '../repositories/quotationRepository';
import { QuotationLineItemRepository } from '../repositories/quotationLineItemRepository';
import { Quotation, QuotationStatus } from '../models/quotationModel';
import { QuotationLineItem } from '../models/quotationLineItemModel';

export interface QuotationLineInput {
  hsnSac?: string;
  description: string;
  quantity: number;
  unitPriceInr: number;
  discountInr?: number;
  gstRate: number;
}

export interface CreateQuotationDto {
  clientId: string;
  eventId?: string;
  placeOfSupply?: string; // 2-digit state code; falls back to studio state
  lines: QuotationLineInput[];
  notes?: string;
  terms?: string;
  validUntil?: string;
}

export type UpdateQuotationDto = Partial<CreateQuotationDto>;

const sanitize = (q: Quotation, lines: QuotationLineItem[]) => ({
  id: q.id,
  studioId: q.studioId,
  clientId: q.clientId,
  eventId: q.eventId,
  quoteNumber: q.quoteNumber,
  status: q.status,
  placeOfSupply: q.placeOfSupply,
  studioGstin: q.studioGstinSnapshot,
  currency: q.currency,
  subtotalInr: q.subtotalInr,
  discountInr: q.discountInr,
  taxableInr: q.taxableInr,
  cgstInr: q.cgstInr,
  sgstInr: q.sgstInr,
  igstInr: q.igstInr,
  totalInr: q.totalInr,
  notes: q.notes,
  terms: q.terms,
  validUntil: q.validUntil,
  shareSlug: q.shareSlug,
  sentAt: q.sentAt,
  acceptedAt: q.acceptedAt,
  createdAt: q.createdAt,
  updatedAt: q.updatedAt,
  lines: lines.map((l) => ({
    id: l.id,
    hsnSac: l.hsnSac,
    description: l.description,
    quantity: l.quantity,
    unitPriceInr: l.unitPriceInr,
    discountInr: l.discountInr,
    gstRate: l.gstRate,
    taxableInr: l.taxableInr,
    cgstInr: l.cgstInr,
    sgstInr: l.sgstInr,
    igstInr: l.igstInr,
    totalInr: l.totalInr,
  })),
});

const toGstInputs = (lines: QuotationLineInput[]): GstLineInput[] =>
  lines.map((l) => ({
    quantity: l.quantity,
    unitPriceInr: l.unitPriceInr,
    discountInr: l.discountInr ?? 0,
    gstRate: l.gstRate,
  }));

export class QuotationService {
  static async create(studioId: string, dto: CreateQuotationDto): Promise<ApiResponse> {
    try {
      if (!dto.lines?.length) return buildError('At least one line item is required', 400);

      // Resolve studio + client — 404s if either isn't in this tenant.
      const studio = await StudioRepository.findById(studioId);
      if (!studio) return buildError('Studio not found', 404);
      await ClientService.getScoped(studioId, dto.clientId);

      const gstin = studio.gstin ?? null;
      const placeOfSupply = dto.placeOfSupply ?? (gstin ? gstin.slice(0, 2) : null);
      const gst = computeTotals(toGstInputs(dto.lines), gstin, placeOfSupply);

      // Number + rows created in one transaction so a rollback releases the seq.
      const q = await sequelize.transaction(async (tx) => {
        const fy = financialYearCode();
        const seq = await CounterRepository.allocateNext(studioId, 'quotation', fy, tx);
        const quoteNumber = formatDocNumber('Q', fy, seq);

        const quote = await QuotationRepository.create(
          studioId,
          {
            clientId: dto.clientId,
            eventId: dto.eventId ?? null,
            quoteNumber,
            status: 'draft',
            placeOfSupply,
            studioGstinSnapshot: gstin,
            subtotalInr: gst.totals.subtotalInr,
            discountInr: gst.totals.discountInr,
            taxableInr: gst.totals.taxableInr,
            cgstInr: gst.totals.cgstInr,
            sgstInr: gst.totals.sgstInr,
            igstInr: gst.totals.igstInr,
            totalInr: gst.totals.totalInr,
            notes: dto.notes ?? null,
            terms: dto.terms ?? null,
            validUntil: dto.validUntil ?? null,
          } as CreateQuotationInput,
          tx
        );

        await QuotationLineItemRepository.addLines(
          dto.lines.map((l, idx) => ({
            quotationId: quote.id,
            hsnSac: l.hsnSac ?? null,
            description: l.description,
            quantity: l.quantity,
            unitPriceInr: l.unitPriceInr,
            discountInr: l.discountInr ?? 0,
            gstRate: l.gstRate,
            taxableInr: gst.lines[idx].taxableInr,
            cgstInr: gst.lines[idx].cgstInr,
            sgstInr: gst.lines[idx].sgstInr,
            igstInr: gst.lines[idx].igstInr,
            totalInr: gst.lines[idx].totalInr,
            sortOrder: idx,
          })),
          tx
        );
        return quote;
      });

      const lines = await QuotationLineItemRepository.findLinesFor(q.id);
      return buildSuccess(sanitize(q, lines), undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to create quotation');
    }
  }

  static async list(studioId: string, query: BuiltQuery): Promise<ApiResponse> {
    try {
      const { rows, count } = await QuotationRepository.findAndCountAllScoped(studioId, query);
      // list omits line items for brevity
      return buildListResponse(rows.map((q) => sanitize(q, [])), count, query.page);
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve quotations');
    }
  }

  static async get(studioId: string, id: string): Promise<ApiResponse> {
    try {
      const q = await QuotationRepository.findByIdScoped(studioId, id);
      if (!q) return buildError('Quotation not found', 404);
      const lines = await QuotationLineItemRepository.findLinesFor(q.id);
      return buildSuccess(sanitize(q, lines));
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve quotation');
    }
  }

  static async update(studioId: string, id: string, dto: UpdateQuotationDto): Promise<ApiResponse> {
    try {
      const q = await QuotationRepository.findByIdScoped(studioId, id);
      if (!q) return buildError('Quotation not found', 404);
      if (q.status !== 'draft') return buildError('Only draft quotations can be edited', 400);

      // Full recompute if any pricing field changed.
      if (dto.lines || dto.placeOfSupply !== undefined) {
        const existingLines = await QuotationLineItemRepository.findLinesFor(q.id);
        const lines = dto.lines ?? existingLines.map((l) => ({
          hsnSac: l.hsnSac ?? undefined,
          description: l.description,
          quantity: l.quantity,
          unitPriceInr: l.unitPriceInr,
          discountInr: l.discountInr,
          gstRate: l.gstRate,
        }));
        if (!lines.length) return buildError('At least one line item is required', 400);

        const gstin = q.studioGstinSnapshot;
        const placeOfSupply = dto.placeOfSupply ?? q.placeOfSupply;
        const gst = computeTotals(toGstInputs(lines), gstin, placeOfSupply);

        await sequelize.transaction(async (tx) => {
          await QuotationLineItemRepository.deleteLines(q.id, tx);
          await QuotationLineItemRepository.addLines(
            lines.map((l, idx) => ({
              quotationId: q.id,
              hsnSac: l.hsnSac ?? null,
              description: l.description,
              quantity: l.quantity,
              unitPriceInr: l.unitPriceInr,
              discountInr: l.discountInr ?? 0,
              gstRate: l.gstRate,
              taxableInr: gst.lines[idx].taxableInr,
              cgstInr: gst.lines[idx].cgstInr,
              sgstInr: gst.lines[idx].sgstInr,
              igstInr: gst.lines[idx].igstInr,
              totalInr: gst.lines[idx].totalInr,
              sortOrder: idx,
            })),
            tx
          );
          await QuotationRepository.update(
            studioId,
            q.id,
            {
              placeOfSupply,
              subtotalInr: gst.totals.subtotalInr,
              discountInr: gst.totals.discountInr,
              taxableInr: gst.totals.taxableInr,
              cgstInr: gst.totals.cgstInr,
              sgstInr: gst.totals.sgstInr,
              igstInr: gst.totals.igstInr,
              totalInr: gst.totals.totalInr,
              notes: dto.notes ?? q.notes,
              terms: dto.terms ?? q.terms,
              validUntil: dto.validUntil ?? q.validUntil,
            },
            tx
          );
        });
      } else {
        await QuotationRepository.update(studioId, q.id, {
          notes: dto.notes ?? q.notes,
          terms: dto.terms ?? q.terms,
          validUntil: dto.validUntil ?? q.validUntil,
        });
      }

      return QuotationService.get(studioId, id);
    } catch (error) {
      return toErrorResponse(error, 'Failed to update quotation');
    }
  }

  static async send(studioId: string, id: string): Promise<ApiResponse> {
    try {
      const q = await QuotationRepository.findByIdScoped(studioId, id);
      if (!q) return buildError('Quotation not found', 404);
      if (q.status !== 'draft') return buildError('Quotation is not in draft', 400);
      const slug = q.shareSlug ?? randomBytes(16).toString('hex');
      await QuotationRepository.setShareSlug(studioId, id, slug);
      return QuotationService.get(studioId, id);
    } catch (error) {
      return toErrorResponse(error, 'Failed to send quotation');
    }
  }

  static async setStatus(studioId: string, id: string, status: QuotationStatus): Promise<ApiResponse> {
    try {
      const q = await QuotationRepository.findByIdScoped(studioId, id);
      if (!q) return buildError('Quotation not found', 404);
      const extra: Record<string, unknown> = {};
      if (status === 'accepted') extra.acceptedAt = new Date();
      await QuotationRepository.setStatus(studioId, id, status, extra);
      return QuotationService.get(studioId, id);
    } catch (error) {
      return toErrorResponse(error, 'Failed to update quotation status');
    }
  }

  static async remove(studioId: string, id: string): Promise<ApiResponse> {
    try {
      const affected = await QuotationRepository.softDeleteScoped(studioId, id);
      if (!affected) return buildError('Quotation not found', 404);
      return buildSuccess(null, undefined, 204);
    } catch (error) {
      return toErrorResponse(error, 'Failed to delete quotation');
    }
  }

  /**
   * Public share view — the client sees a compact render payload with everything
   * needed to display the quote. Not tenant-scoped on entry because the slug
   * itself is the capability; a valid slug proves the caller was told about it.
   */
  static async getByShareSlug(slug: string): Promise<ApiResponse> {
    try {
      const q = await QuotationRepository.findByShareSlug(slug);
      if (!q || q.status === 'draft') return buildError('Quotation not found', 404);
      const lines = await QuotationLineItemRepository.findLinesFor(q.id);
      const studio = await StudioRepository.findById(q.studioId);
      return buildSuccess({
        studio: studio && {
          name: studio.name,
          slug: studio.slug,
          gstin: studio.gstin,
          email: studio.email,
          phone: studio.phone,
        },
        ...sanitize(q, lines),
      });
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve quotation');
    }
  }
}
