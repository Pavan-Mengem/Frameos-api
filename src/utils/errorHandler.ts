import { UniqueConstraintError, ValidationError, ForeignKeyConstraintError, DatabaseError } from 'sequelize';
import { AppError } from './AppError';
import { ApiResponse, buildError } from './response';
import { logger } from '../config/logger';

// Single place any caught error is turned into an ErrorResponsePayload.
// Every service method's catch block should route through this.
export const toErrorResponse = (error: unknown, fallbackMessage: string): ApiResponse<never> => {
  if (error instanceof AppError) {
    return buildError(error.message, error.statusCode, error.details);
  }

  // Must be checked before ValidationError — UniqueConstraintError subclasses it.
  if (error instanceof UniqueConstraintError) {
    const fields = error.errors?.map((e) => e.path).filter(Boolean);
    return buildError('A record with these values already exists', 409, fields?.length ? { fields } : undefined);
  }

  if (error instanceof ValidationError) {
    const details = error.errors?.map((e) => ({ field: e.path, message: e.message }));
    return buildError('Validation failed', 422, details);
  }

  if (error instanceof ForeignKeyConstraintError) {
    return buildError('Referenced record does not exist or is still in use', 409);
  }

  if (error instanceof DatabaseError) {
    logger.error({ err: error }, fallbackMessage);
    return buildError(fallbackMessage, 500);
  }

  logger.error({ err: error }, fallbackMessage);
  return buildError(fallbackMessage, 500);
};
