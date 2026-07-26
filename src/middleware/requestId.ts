import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

// Adds X-Request-ID to every request/response for tracing across logs.
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const id = (req.headers['x-request-id'] as string) || randomUUID();
  req.id = id;
  res.setHeader('X-Request-ID', id);
  next();
};
