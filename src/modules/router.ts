import { Router } from 'express';
import { usersRouter } from './users';
import { clientsRouter } from './clients';
import { leadsRouter } from './leads';
import { eventsRouter } from './events';
import { quotationsRouter } from './quotations';
import { paymentsRouter } from './payments';
import { galleriesRouter } from './galleries';
import { studiosRouter } from './studios';
import { dashboardRouter } from './dashboard';

// Mounts every domain router under the API prefix.
export const apiRouter = Router();
apiRouter.use(usersRouter);
apiRouter.use(clientsRouter);
apiRouter.use(leadsRouter);
apiRouter.use(eventsRouter);
apiRouter.use(quotationsRouter);
apiRouter.use(paymentsRouter);
apiRouter.use(galleriesRouter);
apiRouter.use(studiosRouter);
apiRouter.use(dashboardRouter);
