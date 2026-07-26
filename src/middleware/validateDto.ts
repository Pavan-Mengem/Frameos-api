import { Request, Response, NextFunction } from 'express';
import { plainToInstance, ClassConstructor } from 'class-transformer';
import { validate } from 'class-validator';
import { buildError, sendResponse } from '../utils/response';

type Source = 'body' | 'query' | 'params';

// Validates a request part against a class-validator DTO and replaces it with
// the transformed instance. Responds directly (no next()) on failure, matching
// the rest of the service layer's "never throw, always return" convention.
export const validateDto =
  <T extends object>(dtoClass: ClassConstructor<T>, source: Source = 'body') =>
  async (req: Request, res: Response, next: NextFunction) => {
    const instance = plainToInstance(dtoClass, req[source], { enableImplicitConversion: true });
    const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: false });

    if (errors.length) {
      const details = errors.map((e) => ({
        field: e.property,
        messages: Object.values(e.constraints ?? {}),
      }));
      return sendResponse(res, buildError('Validation failed', 422, details));
    }

    (req as unknown as Record<Source, unknown>)[source] = instance;
    next();
  };
