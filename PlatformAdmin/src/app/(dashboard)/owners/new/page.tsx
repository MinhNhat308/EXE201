"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { TenantForm } from "@/modules/tenants/components/tenant-form";
import { useCreateTenant } from "@/modules/tenants/api/tenant.queries";
import type { CreateTenantDto } from "@/modules/tenants/types/tenant.types";
import { Button } from "@/components/ui/button";

export default function NewOwnerPage() {
  const router = useRouter();
  const createTenant = useCreateTenant();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase text-slate-500">
            <span>Owners</span>
            <span>/</span>
            <span className="text-primary">Đăng ký mới</span>
          </div>
          <h1 className="text-3xl font-bold text-primary">Tạo owner mới</h1>
          <p className="max-w-2xl text-muted-foreground">Tạo hồ sơ chủ cửa hàng kèm cửa hàng, email quản trị và gói dịch vụ ban đầu.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-slate-600 hover:bg-muted dark:text-slate-300" href="/owners">
            <ArrowLeft className="h-4 w-4" />
            Trở lại danh sách
          </Link>
          <Button form="owner-create-form" className="min-w-40 shadow-[0_10px_20px_rgba(47,128,237,0.25)]" disabled={createTenant.isPending}>
            Tạo owner
          </Button>
        </div>
      </div>
      <TenantForm
        formId="owner-create-form"
        cancelHref="/owners"
        submitLabel="Tạo"
        isSubmitting={createTenant.isPending}
        onSubmit={(values) => createTenant.mutate(values as CreateTenantDto, { onSuccess: () => router.push("/owners") })}
      />
    </div>
  );
}
