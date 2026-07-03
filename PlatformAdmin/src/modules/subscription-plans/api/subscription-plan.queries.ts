import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionPlanApi } from "@/modules/subscription-plans/api/subscription-plan.api";
import type { CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto } from "@/modules/subscription-plans/types/subscription-plan.types";

export const subscriptionPlanQueryKeys = {
  overview: ["subscription-plans", "overview"] as const
};

export function useSubscriptionPlansOverview() {
  return useQuery({
    queryKey: subscriptionPlanQueryKeys.overview,
    queryFn: subscriptionPlanApi.getOverview
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubscriptionPlanDto) => subscriptionPlanApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionPlanQueryKeys.overview })
  });
}

export function useUpdateSubscriptionPlan(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateSubscriptionPlanDto) => subscriptionPlanApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionPlanQueryKeys.overview })
  });
}

export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subscriptionPlanApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: subscriptionPlanQueryKeys.overview })
  });
}
