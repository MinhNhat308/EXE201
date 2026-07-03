"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { LicenseForm } from "@/modules/licenses/components/license-form";
import { useCreateLicense } from "@/modules/licenses/api/license.queries";

export default function NewLicensePage() {
  const router = useRouter();
  const createLicense = useCreateLicense();

  return (
    <div className="space-y-6">
      <div>
        <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" href="/licenses">
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
        <h1 className="text-3xl font-bold text-primary">Tạo license mới</h1>
      </div>
      <LicenseForm
        isSubmitting={createLicense.isPending}
        onSubmit={(values) => createLicense.mutate(values, { onSuccess: () => router.push("/licenses") })}
      />
    </div>
  );
}
