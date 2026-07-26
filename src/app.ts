import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env';
import { sequelize } from './config/database';
import { requestId } from './middleware/requestId';
import { globalRateLimit } from './middleware/rateLimit';
import { errorMiddleware, notFoundHandler } from './middleware/errorMiddleware';
import { apiRouter } from './modules/router';
import { openApiDocument } from './docs/openapi';

// Express app factory — pure wiring, no listen(). Keeps the app testable.
export const createApp = (): Application => {
  const app = express();

  app.use(requestId);
  app.use(helmet());
  app.use(cors({ origin: env.allowedOrigins, credentials: true }));

  // Webhook signature verification needs the raw bytes. `verify` snapshots them
  // onto req.rawBody without preventing normal JSON parsing.
  app.use(
    express.json({
      limit: '1mb',
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );
  app.use(globalRateLimit);

  // Liveness: process is up. Cheap, no DB.
  app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

  // Readiness: dependencies healthy. Load balancers use this to gate traffic.
  app.get('/ready', async (_req, res) => {
    try {
      await sequelize.query('SELECT 1');
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not_ready', reason: 'db' });
    }
  });

  // Public API reference. JSON only — a full Swagger UI is a P1 nice-to-have.
  app.get('/api-docs.json', (_req, res) => res.json(openApiDocument));

  app.use(env.API_PREFIX, apiRouter);

  app.use(notFoundHandler);
  app.use(errorMiddleware);

  return app;
};
