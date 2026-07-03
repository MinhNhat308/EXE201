import { httpClient } from "@/lib/api/http-client";

export type SearchResultItem = {
  id: string;
  type: "owner" | "store" | "contract" | "employee" | "license";
  title: string;
  subtitle: string;
  href: string;
};

export const searchApi = {
  search: (q: string, limit = 8) =>
    httpClient.get<{ results: SearchResultItem[] }>("/search", { params: { q, limit } }).then((response) => response.data)
};
