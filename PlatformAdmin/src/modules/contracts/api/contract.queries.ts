import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { contractApi } from "@/modules/contracts/api/contract.api";
import type { CreateContractDto, UpdateContractDto } from "@/modules/contracts/types/contract.types";
import type { QueryParamsDto } from "@/types/api";

export const contractQueryKeys = {
  all: ["contracts"] as const,
  list: (params: QueryParamsDto) => [...contractQueryKeys.all, "list", params] as const,
  detail: (id: string) => [...contractQueryKeys.all, "detail", id] as const
};

export function useContracts(params: QueryParamsDto) {
  return useQuery({ queryKey: contractQueryKeys.list(params), queryFn: () => contractApi.findAll(params) });
}

export function useContract(id: string) {
  return useQuery({ queryKey: contractQueryKeys.detail(id), queryFn: () => contractApi.findOne(id), enabled: Boolean(id) });
}

export function useCreateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateContractDto) => contractApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractQueryKeys.all })
  });
}

export function useUpdateContract(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateContractDto) => contractApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractQueryKeys.all })
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contractApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: contractQueryKeys.all })
  });
}
