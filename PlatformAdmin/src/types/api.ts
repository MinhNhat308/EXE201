export type SortDirection = "asc" | "desc";

export type QueryParamsDto = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: SortDirection;
  filters?: Record<string, string | number | boolean | undefined>;
};

export type PaginatedResponseDto<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiErrorDto = {
  statusCode: number;
  message: string | string[];
  error?: string;
};
