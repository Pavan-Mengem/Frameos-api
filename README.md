# FrameOS — Backend API

Multi-tenant SaaS API for photography studios. **Node.js + Express + TypeScript + Sequelize (PostgreSQL).**

## Architecture — strict layered, module-per-domain

```
src/
├── app.ts                  Express app factory (middleware + route mounting, no listen)
├── index.ts                Entry point: env validation → DB connect → sync/migrate → listen → graceful shutdown
├── config/                 env (zod-validated), database (sequelize), logger
├── middleware/              cross-cutting: authenticate, authorize (RBAC), validateDto (class-validator), rateLimit, requestId, errorMiddleware
├── utils/                  AppError, response envelope + pagination, tenantScope, queryBuilder
├── db/                     Umzug migration runner
├── migrations/             one file per schema change, source of truth outside dev (DB_AUTO_SYNC=false)
├── scripts/                isolation-check (tenant-isolation gate), makeMigration
├── docs/openapi.ts         hand-maintained OpenAPI 3.0 spec, served at GET /api-docs.json — single source of truth for the API surface
└── modules/
    ├── router.ts           mounts every domain router under the API prefix
    ├── studios/            tenant root
    └── users/              REFERENCE MODULE — auth + team management
        ├── models/                 typed Sequelize models (sequelize-typescript decorators; relations declared inline via @BelongsTo/@HasMany etc.)
        ├── repositories/           ONLY layer that touches the model; every studio-scoped method takes studioId first
        ├── services/               business logic; no req/res; throws AppError
        ├── routes/                 router + middleware wiring (no separate controller layer — routes call services directly)
        ├── dtos/                   class-validator/class-transformer DTOs, checked by validateDto middleware
        └── helpers/                token (JWT), password (bcrypt), otp, otpless
```

Every module (`clients`, `leads`, `events`, `quotations`, `payments`, `galleries`, `jobs`, `webhooks`, `dashboard`) follows this same `models/ repositories/ services/ routes/ dtos/ [helpers/]` shape — copy `users/` or `clients/` (simpler) as the template, not the flat single-file layout implied by older docs.

### Layer rules (enforced)
- **Router** wires middleware (`authenticate`, `authorize`, `validateDto`) → service call → response envelope. There is no separate controller layer in this codebase — routes are thin enough to call services directly.
- **Service** holds all business rules. Framework-agnostic (no `req`/`res`), throws `AppError`.
- **Repository** is the *only* layer importing the model. Every studio-scoped method takes `studioId` first and injects it into `where` via `tenantScope()` — cross-tenant access is structurally impossible. Documented exceptions: auth lookups (resolve an identifier before a studio context exists), `StudioRepository` (studio is the tenant root), and public slug lookups (the slug itself is the capability/permission).
- **DTO** validates at the router boundary via `class-validator`; the transformed instance replaces `req.body`/`query`/`params`. (Only `src/config/env.ts` uses zod — env-var validation, not request DTOs.)

For the full system map — every module's models, business rules, and endpoints — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). For the request/response schema-level API reference, see [docs/API.md](docs/API.md) and `GET /api-docs.json`.

## Run it

```bash
npm install
cp .env.example .env          # fill JWT secrets + DB creds
createdb frameos_db           # or: psql -c "CREATE DATABASE frameos_db;"
npm run dev                   # tsx watch, syncs schema in dev
# health: http://localhost:5000/health
```

`npm run typecheck` — full TS check.  `npm run build && npm start` — production.

## Endpoints (users module)

| Method | Path | Auth |
|---|---|---|
| POST | `/api/v1/auth/register` | public — creates studio + owner atomically |
| POST | `/api/v1/auth/verify-otpless` | public — OTPless token → JWTs |
| POST | `/api/v1/auth/refresh` | public — rotates access + refresh |
| POST | `/api/v1/auth/logout` | bearer |
| GET | `/api/v1/auth/me` | bearer |
| GET | `/api/v1/team` | bearer — paginated, filter by role |
| POST | `/api/v1/team` | owner/admin |
| PATCH | `/api/v1/team/:id/status` | owner/admin |

## Adding the next domain (e.g. `reviews`)

Copy the `clients/` shape (simplest full example):

1. `reviews/models/reviewModel.ts` — typed Sequelize model, `studioId` + indexes, `@BelongsTo`/`@HasMany` relations; add the class to the `models: [...]` array in `src/config/database.ts`.
2. `reviews/dtos/reviewDTO.ts` — `class-validator` create/update/list DTOs.
3. `reviews/repositories/reviewRepository.ts` — every method takes `studioId` first, uses `tenantScope()`.
4. `reviews/services/reviewService.ts` — business rules; calls the repository; throws `AppError`.
5. `reviews/routes/reviewRouter.ts` (+ `routes/index.ts`) — wire `authenticate`, `authorize`, `validateDto`; call the service directly.
6. Mount it in `modules/router.ts` (`apiRouter.use(reviewsRouter)`).
7. Add a migration in `src/migrations/` for the new table.
8. Update `src/docs/openapi.ts` with the new paths/schemas — this also keeps the Postman collection and `docs/API.md` accurate (see [CLAUDE.md](CLAUDE.md) for the doc-sync rule).

That's the whole pattern. Every module is a mechanical copy of this one — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how each existing module actually uses it.
