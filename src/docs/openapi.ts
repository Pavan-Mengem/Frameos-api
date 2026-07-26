/**
 * Hand-rolled OpenAPI 3.0 summary of every endpoint FrameOS ships.
 * Kept intentionally small — it exists so an integrator can see the API
 * surface at a glance and so we have a single source-of-truth manifest
 * for the endpoints the isolation-check script iterates over.
 *
 * Not exhaustive on schemas — refer to the zod DTOs in each module for
 * canonical shapes. Everything under `/public/*` is unauthenticated;
 * everything else expects a Bearer JWT (see /auth/verify-otpless).
 */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'FrameOS API',
    version: '2.0.0',
    description:
      'Multi-tenant SaaS API for Indian photography studios. Every studio-scoped ' +
      'endpoint enforces tenancy at the repository layer via tenantScope() — ' +
      'no query can escape the caller\'s studio_id.',
  },
  servers: [{ url: '/api/v1' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Envelope: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {},
          meta: { type: 'object' },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {},
            },
          },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  tags: [
    { name: 'auth' }, { name: 'studios' }, { name: 'team' },
    { name: 'clients' }, { name: 'leads' }, { name: 'events' },
    { name: 'quotations' }, { name: 'payments' }, { name: 'galleries' },
    { name: 'dashboard' }, { name: 'public' }, { name: 'webhooks' },
  ],
  paths: {
    // --- auth ---
    '/auth/register': { post: { tags: ['auth'], summary: 'Create studio + owner atomically', security: [] } },
    '/auth/verify-otpless': { post: { tags: ['auth'], summary: 'Exchange OTPless token for JWTs', security: [] } },
    '/auth/refresh': { post: { tags: ['auth'], summary: 'Rotate tokens', security: [] } },
    '/auth/logout': { post: { tags: ['auth'], summary: 'Invalidate refresh token' } },
    '/auth/me': { get: { tags: ['auth'], summary: 'Current user + studio' } },

    // --- team ---
    '/team': {
      get: { tags: ['team'], summary: 'List team members' },
      post: { tags: ['team'], summary: 'Invite team member (owner/admin)' },
    },
    '/team/{id}/status': { patch: { tags: ['team'], summary: 'Activate/deactivate (owner/admin)' } },

    // --- studios ---
    '/studios/me': {
      get: { tags: ['studios'], summary: 'Current studio' },
      patch: { tags: ['studios'], summary: 'Update profile + theme + settings' },
    },
    '/themes': { get: { tags: ['studios'], summary: 'List available portfolio themes' } },

    // --- clients ---
    '/clients': {
      get: { tags: ['clients'], summary: 'List clients (search, pagination)' },
      post: { tags: ['clients'], summary: 'Create client' },
    },
    '/clients/{id}': {
      get: { tags: ['clients'], summary: 'Get client' },
      patch: { tags: ['clients'], summary: 'Update client' },
      delete: { tags: ['clients'], summary: 'Soft-delete client' },
    },

    // --- leads ---
    '/leads': {
      get: { tags: ['leads'], summary: 'List leads' },
      post: { tags: ['leads'], summary: 'Create lead' },
    },
    '/leads/{id}': {
      get: { tags: ['leads'], summary: 'Get lead' },
      patch: { tags: ['leads'], summary: 'Update lead' },
      delete: { tags: ['leads'], summary: 'Soft-delete lead' },
    },
    '/leads/{id}/status': { patch: { tags: ['leads'], summary: 'Transition status; won → auto-creates client' } },

    // --- events ---
    '/events': {
      get: { tags: ['events'], summary: 'List events (upcoming, by client, date range)' },
      post: { tags: ['events'], summary: 'Create event (usually from a won lead)' },
    },
    '/events/{id}': {
      get: { tags: ['events'], summary: 'Event detail with team + payment progress' },
      patch: { tags: ['events'], summary: 'Update event' },
      delete: { tags: ['events'], summary: 'Soft-delete event (owner/admin)' },
    },
    '/events/{id}/team': { post: { tags: ['events'], summary: 'Assign team member (owner/admin)' } },
    '/events/{id}/team/{assignmentId}': { delete: { tags: ['events'], summary: 'Remove team member (owner/admin)' } },

    // --- quotations (India GST) ---
    '/quotations': {
      get: { tags: ['quotations'], summary: 'List quotations' },
      post: { tags: ['quotations'], summary: 'Create draft (CGST/SGST or IGST computed by state)' },
    },
    '/quotations/{id}': {
      get: { tags: ['quotations'], summary: 'Get quotation with line items' },
      patch: { tags: ['quotations'], summary: 'Edit while status=draft' },
      delete: { tags: ['quotations'], summary: 'Soft-delete' },
    },
    '/quotations/{id}/send': { post: { tags: ['quotations'], summary: 'Publish + mint share_slug' } },
    '/quotations/{id}/status': { patch: { tags: ['quotations'], summary: 'Set accepted/rejected/expired' } },

    // --- payments ---
    '/payments/orders': { post: { tags: ['payments'], summary: 'Create Razorpay order for advance/balance' } },
    '/payments/manual': { post: { tags: ['payments'], summary: 'Record cash/direct UPI (owner/admin)' } },
    '/payments': { get: { tags: ['payments'], summary: 'List payments' } },
    '/payments/{id}': { get: { tags: ['payments'], summary: 'Get payment' } },

    // --- galleries ---
    '/galleries': {
      get: { tags: ['galleries'], summary: 'List galleries' },
      post: { tags: ['galleries'], summary: 'Create gallery' },
    },
    '/galleries/{id}': {
      get: { tags: ['galleries'], summary: 'Gallery + albums + photos' },
      patch: { tags: ['galleries'], summary: 'Update (password, expiry, active, cover)' },
      delete: { tags: ['galleries'], summary: 'Soft-delete' },
    },
    '/galleries/{id}/albums': { post: { tags: ['galleries'], summary: 'Create album' } },
    '/galleries/{id}/albums/{albumId}': {
      patch: { tags: ['galleries'], summary: 'Update album' },
      delete: { tags: ['galleries'], summary: 'Delete album' },
    },
    '/galleries/{id}/photos/presign': {
      post: {
        tags: ['galleries'],
        summary: 'Batch-presign direct-to-S3 uploads (up to 50/batch)',
      },
    },
    '/galleries/{id}/photos/confirm': { post: { tags: ['galleries'], summary: 'Confirm uploaded photos + enqueue thumbnails' } },
    '/galleries/{id}/photos/{photoId}': { delete: { tags: ['galleries'], summary: 'Remove photo (deletes S3 objects)' } },

    // --- dashboard ---
    '/dashboard/overview': { get: { tags: ['dashboard'], summary: 'Aggregated counters + recent payments' } },

    // --- public (unauthenticated) ---
    '/public/studios/{slug}': { get: { tags: ['public'], summary: 'Studio portfolio payload (CDN-cached)', security: [] } },
    '/public/studios/{slug}/enquiry': { post: { tags: ['public'], summary: 'Portfolio enquiry → creates a Lead', security: [] } },
    '/public/quotations/{slug}': { get: { tags: ['public'], summary: 'Client view of a shared quotation', security: [] } },
    '/public/galleries/{slug}/access': { post: { tags: ['public'], summary: 'Verify gallery password → returns access token', security: [] } },
    '/public/galleries/{slug}': { get: { tags: ['public'], summary: 'Public gallery (photos + favorites)', security: [] } },
    '/public/galleries/{slug}/favorites': {
      post: { tags: ['public'], summary: 'Add favorite (anonymous)', security: [] },
      delete: { tags: ['public'], summary: 'Remove favorite', security: [] },
    },

    // --- webhooks ---
    '/webhooks/razorpay': { post: { tags: ['webhooks'], summary: 'Razorpay webhook (signature verified)', security: [] } },
  },
} as const;
