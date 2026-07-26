import { Router } from 'express';
import galleryRouter from './galleryRouter';
import publicGalleryRouter from './publicGalleryRouter';

const router = Router();
router.use('/galleries', galleryRouter);
router.use('/', publicGalleryRouter);

export default router;
