"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useContract, useUpdateContract } from "@/modules/contracts/api/contract.queries";
import { ContractForm } from "@/modules/contracts/components/contract-form";

export default function EditContractPage() {
  const params = useParams<{ contractId: string }>();
  const router = useRouter();
  const contract = useContract(params.contractId);
  const updateContract = useUpdateContract(params.contractId);

  if (contract.isLoading) {
    return <div className="rounded-lg border bg-white p-8 text-sm text-muted-foreground">Loading contract...</div>;
  }

  if (!contract.data) {
    return <div className="rounded-lg border bg-white p-8 text-sm text-muted-foreground">Contract not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href={`/contracts/${params.contractId}`} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300">
            <ArrowLeft className="h-4 w-4" />
            Quay lại chi tiết
          </Link>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Chỉnh sửa hợp đồng {contract.data.code}</h1>
        </div>
        <Button form="contract-edit-form" className="w-fit min-w-44 rounded-xl shadow-[0_10px_20px_rgba(47,128,237,0.25)]" disabled={updateContract.isPending}>
          Lưu thay đổi
        </Button>
      </div>
      <ContractForm
        formId="contract-edit-form"
        submitLabel="Lưu thay đổi"
        isSubmitting={updateContract.isPending}
        initialValues={{
          tenantId: contract.data.tenantId,
          plan: contract.data.plan,
          startDate: contract.data.startDate,
          endDate: contract.data.endDate,
          amount: contract.data.amount,
          status: contract.data.status
        }}
        onSubmit={(values) => updateContract.mutate(values, { onSuccess: () => router.push(`/contracts/${params.contractId}`) })}
      />
    </div>
  );
}
