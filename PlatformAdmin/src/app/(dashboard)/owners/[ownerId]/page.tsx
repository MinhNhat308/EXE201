"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDeleteTenant, useTenant } from "@/modules/tenants/api/tenant.queries";
import { TenantDetailFields } from "@/modules/tenants/components/tenant-detail-fields";
import { TenantStatusEditor } from "@/modules/tenants/components/tenant-status-editor";

export default function OwnerDetailPage() {
  const params = useParams<{ ownerId: string }>();
  const router = useRouter();
  const tenant = useTenant(params.ownerId);
  const deleteTenant = useDeleteTenant();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    deleteTenant.mutate(params.ownerId, {
      onSuccess: () => {
        setConfirmOpen(false);
        router.push("/owners");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" href="/owners">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Owners</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Chi tiết owner</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
            href={`/owners/${params.ownerId}/edit`}
          >
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </Link>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={deleteTenant.isPending}>
            <Trash2 className="h-4 w-4" />
            Tạm khóa cửa hàng
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>{tenant.data?.ownerName ?? "Loading..."}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          {tenant.data ? (
            <>
              <TenantDetailFields tenant={tenant.data} />
              <p>
                Store:{" "}
                <Link className="font-semibold text-primary" href={`/tenants/${tenant.data.id}`}>
                  {tenant.data.name}
                </Link>
              </p>
              <div className="space-y-1">
                <p className="font-semibold">Status</p>
                <TenantStatusEditor tenantId={tenant.data.id} status={tenant.data.status} />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        title="Tạm khóa cửa hàng"
        description="Owner không bị xóa; cửa hàng và gói đăng ký sẽ chuyển sang trạng thái tạm khóa."
        isLoading={deleteTenant.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
