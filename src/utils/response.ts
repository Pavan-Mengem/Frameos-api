import { Response } from 'express';

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SuccessResponsePayload<T> {
  statusCode: number;
  success: true;
  message?: string;
  data: T;
  meta?: PageMeta;
}

interface ErrorResponsePayload {
  statusCode: number;
  success: false;
  message: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = SuccessResponsePayload<T> | ErrorResponsePayload;

// Pure builders — no Express access, so services can construct these directly.
export const buildSuccess = <T>(data: T, message?: string, statusCode = 200, meta?: PageMeta): ApiResponse<T> => ({
  statusCode,
  success: true,
  ...(message ? { message } : {}),
  data,
  ...(meta ? { meta } : {}),
});

export const buildError = (message: string, statusCode = 500, details?: unknown): ApiResponse<never> => ({
  statusCode,
  success: false,
  message,
  ...(details !== undefined ? { details } : {}),
});

// The only place that touches Express `res`. 204 must carry no body (HTTP spec).
export const sendResponse = (res: Response, response: ApiResponse) => {
  if (response.statusCode === 204) return res.status(204).send();
  return res.status(response.statusCode).json(response);
};
