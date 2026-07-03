"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { LicenseForm } from "@/modules/licenses/components/license-form";
import { useLicense, useUpdateLicense } from "@/modules/licenses/api/license.queries";

export default function EditLicensePage() {
  const params = useParams<{ licenseId: string }>();
  const router = useRouter();
  const license = useLicense(params.licenseId);
  const updateLicense = useUpdateLicense(params.licenseId);

  return (
    <div className="space-y-6">
      <div>
        <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" href={`/licenses/${params.licenseId}`}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại chi tiết
        </Link>
        <h1 className="text-3xl font-bold text-primary">Chỉnh sửa license</h1>
      </div>
      {license.data ? (
        <LicenseForm
          submitLabel="Lưu thay đổi"
          isSubmitting={updateLicense.isPending}
          initialValues={license.data}
          onSubmit={(values) => updateLicense.mutate(values, { onSuccess: () => router.push(`/licenses/${params.licenseId}`) })}
        />
      ) : null}
    </div>
  );
}
