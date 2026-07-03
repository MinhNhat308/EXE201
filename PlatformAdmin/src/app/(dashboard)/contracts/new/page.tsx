"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { ContractForm } from "@/modules/contracts/components/contract-form";
import { useCreateContract } from "@/modules/contracts/api/contract.queries";
import { Button } from "@/components/ui/button";

export default function NewContractPage() {
  const router = useRouter();
  const createContract = useCreateContract();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/contracts" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
          <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Tạo hợp đồng mới</h1>
        </div>
        <Button form="contract-create-form" className="w-fit min-w-44 rounded-xl shadow-[0_10px_20px_rgba(47,128,237,0.25)]" disabled={createContract.isPending} >
          Tạo và Gửi hợp đồng
        </Button> 
      </div>
      <ContractForm
        formId="contract-create-form"
        isSubmitting={createContract.isPending}
        onSubmit={(values) =>
          createContract.mutate(values, {
            onSuccess: (contract) => router.push(`/contracts/success?id=${contract.id}`)
          })
        }
      />
    </div>
  );
}
