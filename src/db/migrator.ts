import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize';
import path from 'path';
import { sequelize } from '../config/database';
import { logger } from '../config/logger';

// Migrations are the source of truth for schema in every non-dev environment.
// Dev keeps sequelize.sync({ alter: true }) for iteration; prod runs `npm run migrate`.
export const migrator = new Umzug({
  migrations: {
    glob: ['../migrations/*.{ts,js}', { cwd: __dirname }],
  },
  context: sequelize,
  storage: new SequelizeStorage({ sequelize, tableName: 'schema_migrations' }),
  logger,
});

export type Migration = (params: { context: Sequelize; name: string; path?: string }) => Promise<unknown>;

// Allow `tsx src/db/migrator.ts up|down|pending|create --name ...`
if (require.main === module) {
  migrator.runAsCLI();
}
