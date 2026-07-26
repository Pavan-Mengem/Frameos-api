import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { sequelize } from './config/database';

// Entry point: env is validated on import; connect DB, then listen. Every
// model's associations are wired via @HasMany/@BelongsTo/@HasOne decorators
// and registered when the model classes are passed to sequelize-typescript's
// `models: [...]` in src/config/database.ts — no separate wiring step needed.
const start = async () => {
  await sequelize.authenticate();
  logger.info('Database connection established');

  // Dev convenience: sequelize.sync mirrors model changes into the DB.
  // In prod, migrations (npm run migrate) are the sole source of truth.
  if (!env.isProd && env.DB_AUTO_SYNC === 'true') {
    await sequelize.sync({ alter: true });
    logger.info('Models synced (dev)');
  }

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`FrameOS API listening on :${env.PORT}${env.API_PREFIX}`);
  });

  // Graceful shutdown — drain connections, close DB pool.
  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await sequelize.close();
      logger.info('Closed cleanly');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

start().catch((err) => {
  logger.error({ err: err instanceof Error ? err.message : err }, 'Fatal startup error');
  process.exit(1);
});
