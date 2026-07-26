import { Router } from 'express';
import studioRouter from './studioRouter';

const router = Router();
router.use('/', studioRouter);

export default router;
