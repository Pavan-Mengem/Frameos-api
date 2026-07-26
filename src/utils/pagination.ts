import { PageMeta, ApiResponse, buildSuccess } from './response';

export interface PageParams {
  page: number;
  limit: number;
  offset: number;
}

// Parses ?page & ?limit (clamped) into Sequelize-ready limit/offset.
export const getPagination = (query: { page?: unknown; limit?: unknown }): PageParams => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, offset: (page - 1) * limit };
};

export const buildMeta = (total: number, { page, limit }: PageParams): PageMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 1,
});

// List-endpoint convenience: wraps rows+count straight into an ApiResponse.
export const buildListResponse = <T>(rows: T[], count: number, page: PageParams): ApiResponse<T[]> =>
  buildSuccess(rows, undefined, 200, buildMeta(count, page));
