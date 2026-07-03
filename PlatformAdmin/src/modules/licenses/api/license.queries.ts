import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { licenseApi } from "@/modules/licenses/api/license.api";
import type { CreateLicenseDto, UpdateLicenseDto } from "@/modules/licenses/types/license.types";
import type { QueryParamsDto } from "@/types/api";

export const licenseQueryKeys = {
  all: ["licenses"] as const,
  list: (params: QueryParamsDto) => [...licenseQueryKeys.all, "list", params] as const,
  detail: (id: string) => [...licenseQueryKeys.all, "detail", id] as const
};

export function useLicenses(params: QueryParamsDto) {
  return useQuery({ queryKey: licenseQueryKeys.list(params), queryFn: () => licenseApi.findAll(params) });
}

export function useLicense(id: string) {
  return useQuery({ queryKey: licenseQueryKeys.detail(id), queryFn: () => licenseApi.findOne(id), enabled: Boolean(id) });
}

export function useCreateLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLicenseDto) => licenseApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: licenseQueryKeys.all })
  });
}

export function useUpdateLicense(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLicenseDto) => licenseApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: licenseQueryKeys.all })
  });
}

export function useDeleteLicense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => licenseApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: licenseQueryKeys.all })
  });
}
