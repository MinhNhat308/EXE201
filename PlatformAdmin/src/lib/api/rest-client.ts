import { httpClient } from "@/lib/api/http-client";
import type { PaginatedResponseDto, QueryParamsDto } from "@/types/api";

export class RestClient<TEntity, TCreateDto, TUpdateDto> {
  constructor(protected readonly resourcePath: string) {}

  findAll(params?: QueryParamsDto) {
    return httpClient
      .get<PaginatedResponseDto<TEntity>>(this.resourcePath, { params })
      .then((response) => response.data);
  }

  findOne(id: string) {
    return httpClient
      .get<TEntity>(`${this.resourcePath}/${id}`)
      .then((response) => response.data);
  }

  create(payload: TCreateDto) {
    return httpClient
      .post<TEntity>(this.resourcePath, payload)
      .then((response) => response.data);
  }

  update(id: string, payload: TUpdateDto) {
    return httpClient
      .patch<TEntity>(`${this.resourcePath}/${id}`, payload)
      .then((response) => response.data);
  }

  remove(id: string) {
    return httpClient
      .delete<void>(`${this.resourcePath}/${id}`)
      .then((response) => response.data);
  }
}
