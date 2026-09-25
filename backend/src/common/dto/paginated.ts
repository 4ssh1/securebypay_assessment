export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export class Paginated<T> {
  readonly meta: PageMeta;

  constructor(
    readonly items: T[],
    page: number,
    limit: number,
    total: number,
  ) {
    this.meta = { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }
}
