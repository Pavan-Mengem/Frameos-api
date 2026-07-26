/**
 * Tenant-isolation launch gate (PRD G5, Section 8.3).
 *
 * Spins up the app in-process, provisions two studios with independent owners,
 * then confirms Studio A cannot read or write any of Studio B's resources.
 * Requires a running Postgres reachable via DB_* env vars — this is a live
 * check, not a mock.
 *
 * Usage:
 *   TEST_DB=frameos_isolation npm run check:isolation
 *
 * Any non-2xx behavior on Studio A's own resources OR any 2xx on Studio B's
 * resources fails the run.
 */
import http from 'http';
import { AddressInfo } from 'net';
import { createApp } from '../app';
import { sequelize } from '../config/database';
import { migrator } from '../db/migrator';

interface Ctx {
  baseUrl: string;
  server: http.Server;
}

interface StudioCtx {
  studioId: string;
  userId: string;
  token: string;
}

const req = async <T>(
  ctx: Ctx,
  method: string,
  path: string,
  body?: unknown,
  token?: string
): Promise<{ status: number; body: T }> => {
  const res = await fetch(`${ctx.baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: (await res.json().catch(() => ({}))) as T };
};

const provisionStudio = async (ctx: Ctx, name: string, phone: string): Promise<StudioCtx> => {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const { status, body } = await req<{
    data: { studioId: string; user: { id: string }; accessToken: string; refreshToken: string };
  }>(ctx, 'POST', '/api/v1/auth/register', {
    studioName: name,
    slug,
    ownerName: `Owner ${name}`,
    phone,
  });
  if (status !== 201) throw new Error(`register failed: ${status} ${JSON.stringify(body)}`);
  return {
    studioId: body.data.studioId,
    userId: body.data.user.id,
    token: body.data.accessToken,
  };
};

// Every check declares: a resource A creates, then B attempts to touch. If any
// attempt succeeds (2xx), the check FAILS.
const runChecks = async (ctx: Ctx, A: StudioCtx, B: StudioCtx) => {
  const results: Array<{ name: string; ok: boolean; detail?: string }> = [];
  const record = (name: string, ok: boolean, detail?: string) => results.push({ name, ok, detail });

  const assertForbidden = async (name: string, status: number) => {
    // 404 (repository can't find it in caller's tenant) and 403 both prove isolation.
    const ok = status === 404 || status === 403;
    record(name, ok, `status=${status}`);
  };

  // 1. Clients
  const { body: clientA } = await req<{ data: { id: string } }>(ctx, 'POST', '/api/v1/clients', { name: 'A-Client' }, A.token);
  const rId = clientA.data.id;
  {
    const { status } = await req(ctx, 'GET', `/api/v1/clients/${rId}`, undefined, B.token);
    await assertForbidden('clients:get-cross-tenant', status);
  }
  {
    const { status } = await req(ctx, 'PATCH', `/api/v1/clients/${rId}`, { name: 'stolen' }, B.token);
    await assertForbidden('clients:patch-cross-tenant', status);
  }
  {
    const { status } = await req(ctx, 'DELETE', `/api/v1/clients/${rId}`, undefined, B.token);
    await assertForbidden('clients:delete-cross-tenant', status);
  }

  // 2. Leads
  const { body: leadA } = await req<{ data: { id: string } }>(ctx, 'POST', '/api/v1/leads', { name: 'A-Lead' }, A.token);
  const lId = leadA.data.id;
  {
    const { status } = await req(ctx, 'GET', `/api/v1/leads/${lId}`, undefined, B.token);
    await assertForbidden('leads:get-cross-tenant', status);
  }
  {
    const { status } = await req(ctx, 'PATCH', `/api/v1/leads/${lId}/status`, { status: 'contacted' }, B.token);
    await assertForbidden('leads:status-cross-tenant', status);
  }

  // 3. Events
  const { body: evA } = await req<{ data: { id: string } }>(
    ctx, 'POST', '/api/v1/events',
    { clientId: rId, title: 'A-Event', eventDate: '2026-12-31', totalInr: 100000, advanceInr: 25000 },
    A.token
  );
  const eId = evA.data.id;
  {
    const { status } = await req(ctx, 'GET', `/api/v1/events/${eId}`, undefined, B.token);
    await assertForbidden('events:get-cross-tenant', status);
  }

  // 4. Quotations
  const { body: quoA } = await req<{ data: { id: string } }>(
    ctx, 'POST', '/api/v1/quotations',
    { clientId: rId, lines: [{ description: 'photo', quantity: 1, unitPriceInr: 10000, gstRate: 18 }] },
    A.token
  );
  const qId = quoA.data.id;
  {
    const { status } = await req(ctx, 'GET', `/api/v1/quotations/${qId}`, undefined, B.token);
    await assertForbidden('quotations:get-cross-tenant', status);
  }

  // 5. Galleries
  const { body: galA } = await req<{ data: { id: string } }>(ctx, 'POST', '/api/v1/galleries', { title: 'A-Gallery' }, A.token);
  const gId = galA.data.id;
  {
    const { status } = await req(ctx, 'GET', `/api/v1/galleries/${gId}`, undefined, B.token);
    await assertForbidden('galleries:get-cross-tenant', status);
  }
  {
    const { status } = await req(ctx, 'PATCH', `/api/v1/galleries/${gId}`, { title: 'stolen' }, B.token);
    await assertForbidden('galleries:patch-cross-tenant', status);
  }

  // 6. Sanity: A can still touch its own resources.
  const { status: okOwnStatus } = await req(ctx, 'GET', `/api/v1/clients/${rId}`, undefined, A.token);
  record('sanity:owner-can-read-own', okOwnStatus === 200, `status=${okOwnStatus}`);

  return results;
};

const main = async () => {
  await sequelize.authenticate();
  await migrator.up();

  const app = createApp();
  const server = app.listen(0);
  await new Promise<void>((r) => server.once('listening', () => r()));
  const port = (server.address() as AddressInfo).port;
  const ctx: Ctx = { baseUrl: `http://127.0.0.1:${port}`, server };

  try {
    const A = await provisionStudio(ctx, `Studio-A-${Date.now()}`, `+9198${Date.now().toString().slice(-8)}`);
    const B = await provisionStudio(ctx, `Studio-B-${Date.now()}`, `+9197${Date.now().toString().slice(-8)}`);
    const results = await runChecks(ctx, A, B);

    const failed = results.filter((r) => !r.ok);
    // eslint-disable-next-line no-console
    console.log('\nIsolation check results:');
    for (const r of results) {
      // eslint-disable-next-line no-console
      console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.name} ${r.detail ?? ''}`);
    }
    if (failed.length) {
      // eslint-disable-next-line no-console
      console.error(`\n${failed.length} isolation check(s) failed. DO NOT SHIP.`);
      process.exit(1);
    }
    // eslint-disable-next-line no-console
    console.log('\nAll isolation checks passed.');
  } finally {
    server.close();
    await sequelize.close();
  }
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
