export type ApiEnvelope<T> = {
  statusCode?: number;
  message?: string;
  content: T;
  dateTime?: string;
  messageConstants?: unknown;
};

export type PagingQuery = {
  pageIndex?: number;
  pageSize?: number;
  keyword?: string;
};

export type PagingResult<T> = {
  pageIndex: number;
  pageSize: number;
  totalRow: number;
  keywords?: string | null;
  data: T[];
};

export type SearchParamsValue =
  | string
  | number
  | boolean
  | null
  | undefined;
