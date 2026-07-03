import { httpClient } from "@/lib/api/http-client";
import type {
  CreateSubscriptionPlanDto,
  SubscriptionPlanDto,
  SubscriptionPlansOverviewDto,
  UpdateSubscriptionPlanDto
} from "@/modules/subscription-plans/types/subscription-plan.types";

export const subscriptionPlanApi = {
  getOverview: () => httpClient.get<SubscriptionPlansOverviewDto>("/subscription-plans/overview").then((response) => response.data),
  create: (payload: CreateSubscriptionPlanDto) =>
    httpClient.post<SubscriptionPlanDto>("/subscription-plans", payload).then((response) => response.data),
  update: (id: string, payload: UpdateSubscriptionPlanDto) =>
    httpClient.patch<SubscriptionPlanDto>(`/subscription-plans/${id}`, payload).then((response) => response.data),
  remove: (id: string) => httpClient.delete<void>(`/subscription-plans/${id}`).then((response) => response.data)
};
