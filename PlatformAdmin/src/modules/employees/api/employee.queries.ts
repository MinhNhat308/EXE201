import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { employeeApi } from "@/modules/employees/api/employee.api";
import type { CreateEmployeeDto, UpdateEmployeeDto } from "@/modules/employees/types/employee.types";
import type { QueryParamsDto } from "@/types/api";

export const employeeQueryKeys = {
  all: ["employees"] as const,
  list: (params: QueryParamsDto) => [...employeeQueryKeys.all, "list", params] as const,
  detail: (id: string) => [...employeeQueryKeys.all, "detail", id] as const
};

export function useEmployees(params: QueryParamsDto) {
  return useQuery({ queryKey: employeeQueryKeys.list(params), queryFn: () => employeeApi.findAll(params) });
}

export function useEmployee(id: string) {
  return useQuery({ queryKey: employeeQueryKeys.detail(id), queryFn: () => employeeApi.findOne(id), enabled: Boolean(id) });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeeDto) => employeeApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all })
  });
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateEmployeeDto) => employeeApi.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all })
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => employeeApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all })
  });
}
