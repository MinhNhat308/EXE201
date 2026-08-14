"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { TenantForm } from "@/modules/tenants/components/tenant-form";
import type { CreateTenantDto } from "@/modules/tenants/types/tenant.types";
import { useCreateTenant } from "@/modules/tenants/api/tenant.queries";
import { Button } from "@/components/ui/button";

export default function NewTenantPage() {
  const router = useRouter();
  const createTenant = useCreateTenant();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <span>Người thuê</span>
            <span>/</span>
            <span className="text-primary">Đăng ký mới</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Tạo người thuê mới</h1>
          <p className="max-w-2xl text-muted-foreground">Khởi tạo hệ thống mới cho hạ tầng BobaPOS. Tất cả thông tin đều bắt buộc cho bước kiểm tra ban đầu.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50" href="/tenants">
            <ArrowLeft className="h-4 w-4" />
            Trở lại danh sách
          </Link>
          <Button form="tenant-create-form" className="min-w-40 shadow-[0_10px_20px_rgba(47,128,237,0.25)]" disabled={createTenant.isPending}>
            Tạo người thuê
          </Button>
        </div>
      </div>
      <TenantForm
        formId="tenant-create-form"
        cancelHref="/tenants"
        submitLabel="Tạo"
        isSubmitting={createTenant.isPending}
        onSubmit={(values) => createTenant.mutate(values as CreateTenantDto, { onSuccess: () => router.push("/tenants") })}
      />
    </div>
  );
}
