import { Router, Request, Response } from 'express';
import { GalleryService } from '../services/galleryService';
import { authenticate } from '../../../middleware/authenticate';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { buildQueryOptions } from '../../../utils/queryBuilder';
import {
  CreateGalleryDTO, UpdateGalleryDTO, CreateAlbumDTO, UpdateAlbumDTO, PresignDTO, ConfirmDTO,
} from '../dtos/galleryDTO';

const router = Router();

router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const query = buildQueryOptions(req.query, {
    searchableFields: ['title'],
    filterFields: ['eventId', 'isActive'],
    sortableFields: ['title', 'createdAt'],
    defaultSort: [['createdAt', 'DESC']],
  });
  const result = await GalleryService.list(req.user.studioId, query);
  sendResponse(res, result);
});

router.post('/', validateDto(CreateGalleryDTO), async (req: Request, res: Response) => {
  const result = await GalleryService.create(req.user.studioId, req.body);
  sendResponse(res, result);
});

router.get('/:id', async (req: Request, res: Response) => {
  const result = await GalleryService.get(req.user.studioId, req.params.id);
  sendResponse(res, result);
});

router.patch('/:id', validateDto(UpdateGalleryDTO), async (req: Request, res: Response) => {
  const result = await GalleryService.update(req.user.studioId, req.params.id, req.body);
  sendResponse(res, result);
});

router.delete('/:id', async (req: Request, res: Response) => {
  const result = await GalleryService.remove(req.user.studioId, req.params.id);
  sendResponse(res, result);
});

router.post('/:id/albums', validateDto(CreateAlbumDTO), async (req: Request, res: Response) => {
  const result = await GalleryService.addAlbum(req.user.studioId, req.params.id, req.body.title, req.body.sortOrder ?? 0);
  sendResponse(res, result);
});

router.patch('/:id/albums/:albumId', validateDto(UpdateAlbumDTO), async (req: Request, res: Response) => {
  const result = await GalleryService.updateAlbum(req.user.studioId, req.params.albumId, req.body);
  sendResponse(res, result);
});

router.delete('/:id/albums/:albumId', async (req: Request, res: Response) => {
  const result = await GalleryService.removeAlbum(req.user.studioId, req.params.albumId);
  sendResponse(res, result);
});

router.post('/:id/photos/presign', validateDto(PresignDTO), async (req: Request, res: Response) => {
  const result = await GalleryService.presign(req.user.studioId, req.params.id, req.body.items);
  sendResponse(res, result);
});

router.post('/:id/photos/confirm', validateDto(ConfirmDTO), async (req: Request, res: Response) => {
  const result = await GalleryService.confirm(req.user.studioId, req.params.id, req.body.photoIds);
  sendResponse(res, result);
});

router.delete('/:id/photos/:photoId', async (req: Request, res: Response) => {
  const result = await GalleryService.removePhoto(req.user.studioId, req.params.photoId);
  sendResponse(res, result);
});

export default router;
