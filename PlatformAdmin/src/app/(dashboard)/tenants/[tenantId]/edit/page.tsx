"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { TenantForm } from "@/modules/tenants/components/tenant-form";
import type { UpdateTenantDto } from "@/modules/tenants/types/tenant.types";
import { useTenant, useUpdateTenant } from "@/modules/tenants/api/tenant.queries";
import { Button } from "@/components/ui/button";

export default function EditTenantPage() {
  const params = useParams<{ tenantId: string }>();
  const router = useRouter();
  const tenant = useTenant(params.tenantId);
  const updateTenant = useUpdateTenant(params.tenantId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300" href={`/tenants/${params.tenantId}`}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại chi tiết
          </Link>
          <h1 className="text-3xl font-bold text-primary">Chỉnh sửa cửa hàng</h1>
        </div>
        <Button form="tenant-edit-form" className="min-w-40" disabled={updateTenant.isPending || tenant.isLoading}>
          Lưu thay đổi
        </Button>
      </div>
      {tenant.data ? (
        <TenantForm
          mode="edit"
          formId="tenant-edit-form"
          cancelHref={`/tenants/${params.tenantId}`}
          submitLabel="Lưu thay đổi"
          isSubmitting={updateTenant.isPending}
          initialValues={tenant.data}
          onSubmit={(values) => updateTenant.mutate(values as UpdateTenantDto, { onSuccess: () => router.push(`/tenants/${params.tenantId}`) })}
        />
      ) : null}
    </div>
  );
}
