"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import { useDeleteLicense, useLicense } from "@/modules/licenses/api/license.queries";
import { useTenant } from "@/modules/tenants/api/tenant.queries";

export default function LicenseDetailPage() {
  const params = useParams<{ licenseId: string }>();
  const router = useRouter();
  const license = useLicense(params.licenseId);
  const tenant = useTenant(license.data?.tenantId ?? "");
  const deleteLicense = useDeleteLicense();
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" href="/licenses">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
          <h1 className="text-3xl font-bold text-primary">Chi tiết license</h1>
        </div>
        <div className="flex gap-2">
          <Link className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold hover:bg-muted" href={`/licenses/${params.licenseId}/edit`}>
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </Link>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={deleteLicense.isPending}>
            <Trash2 className="h-4 w-4" />
            Xóa
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{license.data?.licenseKey ?? "Loading..."}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <p>Plan: {license.data?.plan}</p>
          <p>Status: {license.data ? <StatusBadge status={license.data.status} /> : null}</p>
          <p>Store: {tenant.data?.name ?? license.data?.tenantId}</p>
          <p>Max stores: {license.data?.maxStores}</p>
          <p>Issued: {license.data?.issuedAt}</p>
          <p>Expires: {license.data?.expiresAt}</p>
          <p className="md:col-span-2">Features: {license.data?.features.join(", ")}</p>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        title="Xóa license"
        description="License sẽ bị xóa khỏi hệ thống."
        isLoading={deleteLicense.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() =>
          deleteLicense.mutate(params.licenseId, {
            onSuccess: () => router.push("/licenses")
          })
        }
      />
    </div>
  );
}
