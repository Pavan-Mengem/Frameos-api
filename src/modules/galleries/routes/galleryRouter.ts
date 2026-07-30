import { Router, Request, Response } from 'express';
import { GalleryService } from '../services/galleryService';
import { authenticate } from '../../../middleware/authenticate';
import { validateDto } from '../../../middleware/validateDto';
import { sendResponse } from '../../../utils/response';
import { buildQueryOptions } from '../../../utils/queryBuilder';
import { IdParamDTO } from '../../../utils/paramDTOs';
import {
  CreateGalleryDTO, UpdateGalleryDTO, CreateAlbumDTO, UpdateAlbumDTO, PresignDTO, ConfirmDTO,
  GalleryAlbumParamsDTO, GalleryPhotoParamsDTO,
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

router.get('/:id', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await GalleryService.get(req.user.studioId, id);
  sendResponse(res, result);
});

router.patch('/:id', validateDto(IdParamDTO, 'params'), validateDto(UpdateGalleryDTO), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await GalleryService.update(req.user.studioId, id, req.body);
  sendResponse(res, result);
});

router.delete('/:id', validateDto(IdParamDTO, 'params'), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await GalleryService.remove(req.user.studioId, id);
  sendResponse(res, result);
});

router.post('/:id/albums', validateDto(IdParamDTO, 'params'), validateDto(CreateAlbumDTO), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await GalleryService.addAlbum(req.user.studioId, id, req.body.title, req.body.sortOrder ?? 0);
  sendResponse(res, result);
});

router.patch(
  '/:id/albums/:albumId',
  validateDto(GalleryAlbumParamsDTO, 'params'),
  validateDto(UpdateAlbumDTO),
  async (req: Request, res: Response) => {
    const { albumId } = req.params as unknown as GalleryAlbumParamsDTO;
    const result = await GalleryService.updateAlbum(req.user.studioId, albumId, req.body);
    sendResponse(res, result);
  }
);

router.delete('/:id/albums/:albumId', validateDto(GalleryAlbumParamsDTO, 'params'), async (req: Request, res: Response) => {
  const { albumId } = req.params as unknown as GalleryAlbumParamsDTO;
  const result = await GalleryService.removeAlbum(req.user.studioId, albumId);
  sendResponse(res, result);
});

router.post('/:id/photos/presign', validateDto(IdParamDTO, 'params'), validateDto(PresignDTO), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await GalleryService.presign(req.user.studioId, id, req.body.items);
  sendResponse(res, result);
});

router.post('/:id/photos/confirm', validateDto(IdParamDTO, 'params'), validateDto(ConfirmDTO), async (req: Request, res: Response) => {
  const { id } = req.params as unknown as IdParamDTO;
  const result = await GalleryService.confirm(req.user.studioId, id, req.body.photoIds);
  sendResponse(res, result);
});

router.delete('/:id/photos/:photoId', validateDto(GalleryPhotoParamsDTO, 'params'), async (req: Request, res: Response) => {
  const { photoId } = req.params as unknown as GalleryPhotoParamsDTO;
  const result = await GalleryService.removePhoto(req.user.studioId, photoId);
  sendResponse(res, result);
});

export default router;
