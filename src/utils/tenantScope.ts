import { WhereOptions } from 'sequelize';

/**
 * Injects studio_id into a Sequelize `where` clause. Every studio-scoped
 * repository method should build its where via this helper so tenant scoping
 * is uniform and greppable — the single biggest correctness risk in this app.
 */
export const tenantScope = <T extends object>(studioId: string, where?: T): WhereOptions =>
  ({ ...(where ?? {}), studioId } as unknown as WhereOptions);
