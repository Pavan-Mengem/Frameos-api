# FrameOS — Backend API

Multi-tenant SaaS API for photography studios. **Node.js + Express + TypeScript + Sequelize (PostgreSQL).**

## Architecture — strict layered, module-per-domain

```
src/
├── app.ts                  Express app factory (middleware + route mounting, no listen)
├── index.ts                Entry point: env validation → DB connect → sync → listen → graceful shutdown
├── config/                 env (zod-validated), database (sequelize), logger (winston)
├── middleware/             cross-cutting: authenticate, authorize (RBAC), validate (zod), rateLimit, requestId, error
├── utils/                  ApiError, asyncHandler, response formatter, pagination
└── modules/
    ├── router.ts           mounts every domain router under the API prefix
    ├── associations.ts     wires cross-module Sequelize relations
    ├── studios/            tenant root (model + repository)
    └── users/              REFERENCE MODULE — auth + team management
        ├── users.model.ts        typed Sequelize model
        ├── otp.model.ts          OTP model (auth concern lives with users)
        ├── users.repository.ts   ONLY layer that touches the model; every method studio-scoped
        ├── users.service.ts      business logic; no req/res; throws ApiError
        ├── users.controller.ts   thin: validated input → one service call → response envelope
        ├── users.router.ts       route defs + middleware wiring
        ├── dto/                   zod schemas + inferred types
        └── helpers/               token (JWT), password (bcrypt), otp, otpless
```

### Layer rules (enforced)
- **Router** wires middleware → controller. No logic.
- **Controller** is thin. Never imports the model or Sequelize.
- **Service** holds all business rules. Framework-agnostic (no `req`/`res`).
- **Repository** is the *only* layer importing the model. Every studio-scoped method takes `studioId` first and injects it into `where` — cross-tenant access is structurally impossible. Auth lookups are the documented exception (they resolve an identifier before a studio context exists).
- **DTO** validates at the router boundary; its inferred types flow into services.

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

## Adding the next domain (e.g. `leads`)

Copy the `users/` shape:

1. `leads/leads.model.ts` — typed model, `studio_id` + indexes, register in `associations.ts`.
2. `leads/dto/leads.dto.ts` — zod create/update/list schemas.
3. `leads/leads.repository.ts` — every method takes `studioId` first.
4. `leads/leads.service.ts` — business rules; calls the repository.
5. `leads/leads.controller.ts` — thin; uses `ok`/`created` + pagination utils.
6. `leads/leads.router.ts` — wire `authenticate`, `authorize`, `validate`.
7. Mount it in `modules/router.ts`.

That's the whole pattern. Every module is a mechanical copy of this one.
