import { Op, Order, WhereOptions } from 'sequelize';
import { getPagination, PageParams } from './pagination';

export interface QueryBuilderOptions {
  searchableFields?: string[];
  filterFields?: string[];
  sortableFields?: string[];
  defaultSort?: Order;
}

export interface BuiltQuery {
  where: WhereOptions;
  order: Order;
  limit: number;
  offset: number;
  page: PageParams;
}

interface RawQuery {
  search?: unknown;
  sortBy?: unknown;
  sortOrder?: unknown;
  [key: string]: unknown;
}

// Shared GET-list-endpoint helper: turns ?search=&<filterField>=&sortBy=&sortOrder=&page=&limit=
// into Sequelize-ready where/order/limit/offset. Whitelists filter/sort fields so callers can't
// probe arbitrary columns via the querystring.
export const buildQueryOptions = (query: RawQuery, opts: QueryBuilderOptions): BuiltQuery => {
  const { searchableFields = [], filterFields = [], sortableFields = [], defaultSort = [] } = opts;
  const page = getPagination(query as { page?: unknown; limit?: unknown });

  const and: WhereOptions[] = [];

  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if (search && searchableFields.length) {
    and.push({
      [Op.or]: searchableFields.map((field) => ({ [field]: { [Op.iLike]: `%${search}%` } })),
    } as WhereOptions);
  }

  for (const field of filterFields) {
    const value = query[field];
    if (value !== undefined && value !== '') {
      and.push({ [field]: value } as WhereOptions);
    }
  }

  const where: WhereOptions = and.length ? { [Op.and]: and } : {};

  const sortBy = typeof query.sortBy === 'string' && sortableFields.includes(query.sortBy) ? query.sortBy : undefined;
  const sortOrder = query.sortOrder === 'ASC' || query.sortOrder === 'DESC' ? query.sortOrder : 'DESC';
  const order: Order = sortBy ? [[sortBy, sortOrder]] : defaultSort;

  return { where, order, limit: page.limit, offset: page.offset, page };
};
