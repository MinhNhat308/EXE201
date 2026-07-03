"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormInput } from "@/components/forms/form-input";
import { FormSelect } from "@/components/forms/form-select";
import { useTenants } from "@/modules/tenants/api/tenant.queries";
import { licenseSchema } from "@/modules/licenses/schemas/license.schema";
import type { LicenseStatus } from "@/modules/licenses/types/license.types";

type LicenseFormValues = z.infer<typeof licenseSchema>;

const statusOptions: { label: string; value: LicenseStatus }[] = [
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Expired", value: "expired" },
  { label: "Suspended", value: "suspended" }
];

export function LicenseForm({
  onSubmit,
  isSubmitting,
  initialValues,
  submitLabel = "Save license",
  formId = "license-form"
}: {
  onSubmit: (values: Omit<LicenseFormValues, "features"> & { features: string[] }) => void;
  isSubmitting?: boolean;
  initialValues?: Partial<Omit<LicenseFormValues, "features">> & { features?: string[] | string };
  submitLabel?: string;
  formId?: string;
}) {
  const tenants = useTenants({ page: 1, limit: 100, search: "", filters: {} });
  const tenantOptions =
    tenants.data?.data.map((tenant) => ({
      label: `${tenant.ownerName} - ${tenant.name}`,
      value: tenant.id
    })) ?? [];

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseSchema),
    defaultValues: {
      tenantId: initialValues?.tenantId ?? "",
      licenseKey: initialValues?.licenseKey ?? "",
      plan: initialValues?.plan ?? "",
      status: initialValues?.status ?? "active",
      issuedAt: initialValues?.issuedAt ?? new Date().toISOString().slice(0, 10),
      expiresAt: initialValues?.expiresAt ?? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      maxStores: initialValues?.maxStores ?? 1,
      features: Array.isArray(initialValues?.features)
        ? initialValues.features.join(", ")
        : initialValues?.features ?? "pos"
    }
  });

  useEffect(() => {
    form.reset({
      tenantId: initialValues?.tenantId ?? "",
      licenseKey: initialValues?.licenseKey ?? "",
      plan: initialValues?.plan ?? "",
      status: initialValues?.status ?? "active",
      issuedAt: initialValues?.issuedAt ?? new Date().toISOString().slice(0, 10),
      expiresAt: initialValues?.expiresAt ?? new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      maxStores: initialValues?.maxStores ?? 1,
      features: Array.isArray(initialValues?.features)
        ? initialValues.features.join(", ")
        : initialValues?.features ?? "pos"
    });
  }, [form, initialValues]);

  return (
    <form
      id={formId}
      className="grid max-w-3xl gap-5 rounded-lg border bg-white p-6"
      onSubmit={form.handleSubmit((values) =>
        onSubmit({
          ...values,
          features: values.features.split(",").map((item) => item.trim()).filter(Boolean)
        })
      )}
    >
      <FormSelect name="tenantId" label="Store / Owner" register={form.register} error={form.formState.errors.tenantId?.message} options={tenantOptions} />
      <FormInput name="licenseKey" label="License key" register={form.register} error={form.formState.errors.licenseKey?.message} />
      <FormInput name="plan" label="Plan" register={form.register} error={form.formState.errors.plan?.message} />
      <FormSelect name="status" label="Status" register={form.register} error={form.formState.errors.status?.message} options={statusOptions} />
      <FormInput name="issuedAt" label="Issued date" type="date" register={form.register} error={form.formState.errors.issuedAt?.message} />
      <FormInput name="expiresAt" label="Expires date" type="date" register={form.register} error={form.formState.errors.expiresAt?.message} />
      <FormInput name="maxStores" label="Max stores" type="number" register={form.register} error={form.formState.errors.maxStores?.message} />
      <FormInput name="features" label="Features (comma-separated)" register={form.register} error={form.formState.errors.features?.message} />
      <Button className="w-fit" disabled={isSubmitting} type="submit">
        {submitLabel}
      </Button>
    </form>
  );
}
