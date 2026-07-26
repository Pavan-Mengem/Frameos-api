import { Request, Response, NextFunction } from 'express';
import { toErrorResponse } from '../utils/errorHandler';
import { buildError, sendResponse } from '../utils/response';
import { logger } from '../config/logger';

// Express-level catch-all for anything that still reaches next(err) — multer,
// validateDto, or an unexpected throw outside a service's own try/catch.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorMiddleware = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const response = toErrorResponse(err, 'Internal server error');
  logger.error({ requestId: req.id, statusCode: response.statusCode, err }, response.message);
  sendResponse(res, response);
};

export const notFoundHandler = (req: Request, res: Response) => {
  sendResponse(res, buildError(`Route not found: ${req.method} ${req.path}`, 404));
};
