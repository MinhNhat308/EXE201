import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/modules/dashboard/api/dashboard.api";

export const dashboardQueryKeys = {
  overview: ["dashboard", "overview"] as const
};

export function useDashboardOverview() {
  return useQuery({ queryKey: dashboardQueryKeys.overview, queryFn: dashboardApi.getOverview });
}
