import { Model } from "mongoose";
import { PaginatedResponse, QueryParams } from "./types";

const ignoredQueryKeys = new Set(["page", "limit", "search", "sortBy", "sortOrder", "filters", "setTableState"]);

export function toDto<T = unknown>(doc: T | null): T | null {
  if (!doc) {
    return null;
  }
  const raw = typeof (doc as any).toObject === "function" ? (doc as any).toObject() : (doc as any);
  const { _id, __v, ...rest } = raw;
  return { id: String(_id), ...rest } as T;
}

export function buildQuery(params: QueryParams, searchFields: string[]) {
  const query: Record<string, unknown> = {};
  const filters = params.filters ?? {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      query[key] = value;
    }
  });

  Object.entries(params).forEach(([key, value]) => {
    if (!ignoredQueryKeys.has(key) && value !== undefined && value !== "" && typeof value !== "function") {
      query[key] = value;
    }
  });

  if (params.search && searchFields.length > 0) {
    query.$or = searchFields.map((field) => ({ [field]: { $regex: params.search, $options: "i" } }));
  }

  return query;
}

export async function paginate(
  model: Model<any>,
  params: QueryParams,
  searchFields: string[]
): Promise<PaginatedResponse<unknown>> {
  const page = Number(params.page ?? 1);
  const limit = Number(params.limit ?? 10);
  const skip = (page - 1) * limit;
  const query = buildQuery(params, searchFields);
  const sortBy = String(params.sortBy ?? "createdAt");
  const sortOrder = params.sortOrder === "asc" ? 1 : -1;

  const [rows, total] = await Promise.all([
    model.find(query).sort({ [sortBy]: sortOrder }).skip(skip).limit(limit).exec(),
    model.countDocuments(query).exec()
  ]);

  return {
    data: rows.map((row) => toDto(row)),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit))
    }
  };
}
