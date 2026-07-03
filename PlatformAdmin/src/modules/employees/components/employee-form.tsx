"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { useTenants } from "@/modules/tenants/api/tenant.queries";
import { employeeSchema } from "@/modules/employees/schemas/employee.schema";
import type { EmployeeStatus } from "@/modules/employees/types/employee.types";

type EmployeeFormValues = z.infer<typeof employeeSchema>;

const employeeRoles = [
  { label: "Admin", value: "admin" },
  { label: "Manager", value: "manager" },
  { label: "Staff", value: "staff" }
];

const employeeStatuses: { label: string; value: EmployeeStatus }[] = [
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Inactive", value: "inactive" }
];

export function EmployeeForm({
  onSubmit,
  isSubmitting,
  initialValues,
  submitLabel = "Save employee",
  showStatusField = false,
  formId = "employee-form"
}: {
  onSubmit: (values: EmployeeFormValues) => void;
  isSubmitting?: boolean;
  initialValues?: Partial<EmployeeFormValues>;
  submitLabel?: string;
  showStatusField?: boolean;
  formId?: string;
}) {
  const tenants = useTenants({ page: 1, limit: 100, search: "", filters: {} });
  const tenantOptions =
    tenants.data?.data.map((tenant) => ({
      label: `${tenant.ownerName} - ${tenant.name}`,
      value: tenant.id
    })) ?? [];

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      tenantId: initialValues?.tenantId ?? "",
      fullName: initialValues?.fullName ?? "",
      email: initialValues?.email ?? "",
      role: initialValues?.role ?? "",
      department: initialValues?.department ?? "",
      status: initialValues?.status ?? "pending",
      ...initialValues
    }
  });

  useEffect(() => {
    form.reset({
      tenantId: initialValues?.tenantId ?? "",
      fullName: initialValues?.fullName ?? "",
      email: initialValues?.email ?? "",
      role: initialValues?.role ?? "",
      department: initialValues?.department ?? "",
      status: initialValues?.status ?? "pending",
      ...initialValues
    });
  }, [form, initialValues]);

  return (
    <form id={formId} className="grid max-w-3xl gap-5 rounded-lg border bg-white p-6" onSubmit={form.handleSubmit(onSubmit)}>
      <FormSelect
        name="tenantId"
        label="Cửa hàng / Owner"
        register={form.register}
        error={form.formState.errors.tenantId?.message}
        options={tenantOptions}
      />
      <FormInput name="fullName" label="Full name" register={form.register} error={form.formState.errors.fullName?.message} />
      <FormInput name="email" label="Email" register={form.register} error={form.formState.errors.email?.message} />
      <FormSelect
        name="role"
        label="Role"
        register={form.register}
        error={form.formState.errors.role?.message}
        options={employeeRoles}
      />
      <FormInput name="department" label="Department" register={form.register} error={form.formState.errors.department?.message} />
      {showStatusField ? (
        <FormSelect
          name="status"
          label="Status"
          register={form.register}
          error={form.formState.errors.status?.message}
          options={employeeStatuses}
        />
      ) : null}
      <Button className="w-fit" disabled={isSubmitting} type="submit">
        {submitLabel}
      </Button>
    </form>
  );
}
