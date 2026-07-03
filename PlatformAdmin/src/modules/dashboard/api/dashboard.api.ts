import { httpClient } from "@/lib/api/http-client";
import type { DashboardOverviewDto } from "@/modules/dashboard/types/dashboard.types";

export const dashboardApi = {
  getOverview: () => httpClient.get<DashboardOverviewDto>("/dashboard/overview").then((response) => response.data)
};
