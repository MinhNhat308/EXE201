import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { tenantApi } from "@/modules/tenants/api/tenant.api";
import type { CreateTenantDto, UpdateTenantDto } from "@/modules/tenants/types/tenant.types";
import type { QueryParamsDto } from "@/types/api";

export const tenantQueryKeys = {
  all: ["tenants"] as const,
  list: (params: QueryParamsDto) => [...tenantQueryKeys.all, "list", params] as const,
  detail: (id: string) => [...tenantQueryKeys.all, "detail", id] as const
};

export function useTenants(params: QueryParamsDto) {
  return useQuery({ queryKey: tenantQueryKeys.list(params), queryFn: () => tenantApi.findAll(params) });
}

export function useTenant(id: string) {
  return useQuery({ queryKey: tenantQueryKeys.detail(id), queryFn: () => tenantApi.findOne(id), enabled: Boolean(id) });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTenantDto) => tenantApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all })
  });
}

export function useUpdateTenant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateTenantDto) => tenantApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all })
  });
}

export function useDeleteTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: tenantQueryKeys.all })
  });
}
