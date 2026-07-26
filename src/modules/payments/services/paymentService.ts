import crypto from 'crypto';
import { Transaction } from 'sequelize';
import { sequelize } from '../../../config/database';
import { ApiResponse, buildError, buildSuccess } from '../../../utils/response';
import { toErrorResponse } from '../../../utils/errorHandler';
import { buildListResponse } from '../../../utils/pagination';
import { BuiltQuery } from '../../../utils/queryBuilder';
import { logger } from '../../../config/logger';
import { StudioRepository } from '../../studios';
import { EventRepository } from '../../events';
import { CounterRepository, formatDocNumber, computeTotals, financialYearCode, stateFromGstin } from '../../invoicing';
import { WebhookEventRepository } from '../../webhooks';
import { PaymentRepository, CreatePaymentInput } from '../repositories/paymentRepository';
import { InvoiceRepository } from '../repositories/invoiceRepository';
import { createOrder, publishableKeyId, verifyWebhookSignature } from '../helpers/razorpay.helper';
import { Payment, PaymentKind, PaymentMethod } from '../models/paymentModel';

const sanitize = (p: Payment) => ({
  id: p.id,
  studioId: p.studioId,
  eventId: p.eventId,
  kind: p.kind,
  amountInr: p.amountInr,
  currency: p.currency,
  gateway: p.gateway,
  gatewayOrderId: p.gatewayOrderId,
  gatewayPaymentId: p.gatewayPaymentId,
  method: p.method,
  status: p.status,
  capturedAt: p.capturedAt,
  notes: p.notes,
  invoiceId: p.invoiceId,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

const singleLineGst = (amountInr: number, gstin: string | null, placeOfSupply: string | null) =>
  // We treat the payment amount as GST-inclusive at 18% (photography services default SAC).
  // Reverse-compute the tax breakdown so invoice totals match the amount collected.
  computeTotals(
    [{ quantity: 1, unitPriceInr: Math.round(amountInr / 1.18), discountInr: 0, gstRate: 18 }],
    gstin,
    placeOfSupply
  );

const generateInvoice = async (studioId: string, payment: Payment, tx: Transaction) => {
  const studio = await StudioRepository.findById(studioId);
  const gstin = studio?.gstin ?? null;
  const pos = stateFromGstin(gstin);
  const gst = singleLineGst(payment.amountInr, gstin, pos);
  const fy = financialYearCode();
  const seq = await CounterRepository.allocateNext(studioId, 'invoice', fy, tx);
  const invoiceNumber = formatDocNumber('INV', fy, seq);
  const invoice = await InvoiceRepository.create(
    {
      studioId,
      eventId: payment.eventId,
      paymentId: payment.id,
      invoiceNumber,
      placeOfSupply: pos,
      studioGstinSnapshot: gstin,
      subtotalInr: gst.totals.subtotalInr,
      discountInr: gst.totals.discountInr,
      taxableInr: gst.totals.taxableInr,
      cgstInr: gst.totals.cgstInr,
      sgstInr: gst.totals.sgstInr,
      igstInr: gst.totals.igstInr,
      totalInr: payment.amountInr, // authoritative — the amount actually collected
    },
    tx
  );
  await PaymentRepository.update(studioId, payment.id, { invoiceId: invoice.id }, tx);
  return invoice;
};

export class PaymentService {
  /**
   * Create a Razorpay order for an event's advance or balance. The client
   * receives an order id + publishable key and completes checkout in-browser.
   * The webhook is the sole source of truth for marking the payment paid.
   */
  static async createOrder(studioId: string, dto: { eventId: string; kind: Exclude<PaymentKind, 'manual'>; amountInr: number }): Promise<ApiResponse> {
    try {
      const ev = await EventRepository.findByIdScoped(studioId, dto.eventId);
      if (!ev) return buildError('Event not found', 404);
      if (dto.amountInr <= 0) return buildError('amountInr must be positive', 400);
      if (dto.kind === 'balance') {
        const balance = Math.max(0, ev.totalInr - ev.paidInr);
        if (dto.amountInr > balance) return buildError(`Amount exceeds outstanding balance ₹${balance}`, 400);
      }

      const receipt = `${ev.id.slice(0, 8)}-${Date.now()}`;
      const order = await createOrder({
        amountInr: dto.amountInr,
        receipt,
        notes: { studioId, eventId: ev.id, kind: dto.kind },
      });

      const payment = await PaymentRepository.create(studioId, {
        eventId: ev.id,
        kind: dto.kind,
        amountInr: dto.amountInr,
        gateway: 'razorpay',
        gatewayOrderId: order.id,
        status: 'created',
      } as CreatePaymentInput);

      return buildSuccess(
        {
          payment: sanitize(payment),
          razorpay: {
            keyId: publishableKeyId(),
            orderId: order.id,
            amountPaise: order.amount,
            currency: order.currency,
          },
        },
        undefined,
        201
      );
    } catch (error) {
      return toErrorResponse(error, 'Failed to create payment order');
    }
  }

  static async recordManual(studioId: string, dto: {
    eventId: string;
    amountInr: number;
    method: 'cash' | 'upi' | 'other';
    notes?: string;
  }): Promise<ApiResponse> {
    try {
      const ev = await EventRepository.findByIdScoped(studioId, dto.eventId);
      if (!ev) return buildError('Event not found', 404);
      if (dto.amountInr <= 0) return buildError('amountInr must be positive', 400);

      const result = await sequelize.transaction(async (tx) => {
        const payment = await PaymentRepository.create(
          studioId,
          {
            eventId: ev.id,
            kind: 'manual',
            amountInr: dto.amountInr,
            gateway: 'manual',
            method: dto.method,
            status: 'paid',
            capturedAt: new Date(),
            notes: dto.notes ?? null,
          } as CreatePaymentInput,
          tx
        );
        await EventRepository.addPaid(studioId, ev.id, dto.amountInr, tx);
        await generateInvoice(studioId, payment, tx);
        const refreshed = await PaymentRepository.findByIdScoped(studioId, payment.id);
        return sanitize(refreshed!);
      });

      return buildSuccess(result, undefined, 201);
    } catch (error) {
      return toErrorResponse(error, 'Failed to record payment');
    }
  }

  static async list(studioId: string, query: BuiltQuery): Promise<ApiResponse> {
    try {
      const { rows, count } = await PaymentRepository.findAndCountAllScoped(studioId, query);
      return buildListResponse(rows.map(sanitize), count, query.page);
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve payments');
    }
  }

  static async get(studioId: string, id: string): Promise<ApiResponse> {
    try {
      const p = await PaymentRepository.findByIdScoped(studioId, id);
      if (!p) return buildError('Payment not found', 404);
      return buildSuccess(sanitize(p));
    } catch (error) {
      return toErrorResponse(error, 'Failed to retrieve payment');
    }
  }

  /**
   * Razorpay webhook entry point. Every side-effect is idempotent:
   *  - Dedupe on (provider, event_id) before touching anything.
   *  - Update payment.status atomically (WHERE status != 'paid').
   *  - Increment event.paid_inr and emit an invoice ONLY when we transition to paid.
   */
  static async handleRazorpayWebhook(rawBody: Buffer, signature: string, body: {
    event: string;
    payload: {
      payment?: { entity: { id: string; order_id: string; method: string; amount: number; status: string } };
    };
    id?: string;
  }): Promise<ApiResponse> {
    try {
      if (!verifyWebhookSignature(rawBody, signature)) {
        return buildError('Invalid webhook signature', 401);
      }

      const eventId = body.id ?? `${body.event}:${body.payload.payment?.entity.id ?? ''}`;
      const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');
      const isNew = await WebhookEventRepository.recordIfNew({
        provider: 'razorpay',
        eventId,
        eventType: body.event,
        payloadHash,
      });
      if (!isNew) {
        logger.info({ eventId, type: body.event }, 'Razorpay webhook replay ignored');
        return buildSuccess({ ok: true, replay: true });
      }

      if (body.event !== 'payment.captured' && body.event !== 'payment.authorized') {
        logger.info({ type: body.event }, 'Razorpay webhook ignored (uninteresting type)');
        return buildSuccess({ ok: true });
      }

      const rp = body.payload.payment?.entity;
      if (!rp) return buildSuccess({ ok: true });

      const payment = await PaymentRepository.findByGatewayOrderId(rp.order_id);
      if (!payment) {
        // Unknown order → likely from another environment. Ack to prevent retries.
        logger.warn({ orderId: rp.order_id }, 'Razorpay webhook for unknown order');
        return buildSuccess({ ok: true });
      }

      await sequelize.transaction(async (tx) => {
        const [affected] = await PaymentRepository.markPaidByOrder(
          rp.order_id,
          rp.id,
          (rp.method as PaymentMethod) ?? 'other',
          tx
        );
        // Another worker may have won the race — bail without double-counting.
        if (!affected) return;

        const captured = Math.round(rp.amount / 100); // paise → ₹
        await EventRepository.addPaid(payment.studioId, payment.eventId, captured, tx);
        const refreshed = await PaymentRepository.findByIdScoped(payment.studioId, payment.id);
        if (refreshed) await generateInvoice(payment.studioId, refreshed, tx);
      });

      return buildSuccess({ ok: true });
    } catch (error) {
      return toErrorResponse(error, 'Failed to process webhook');
    }
  }
}
