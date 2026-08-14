import Link from "next/link";
import { ContractTable } from "@/modules/contracts/components/contract-table";
import { platformCapabilities } from "@/config/capabilities";

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2F80ED]">BOBAPOS Billing</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Hóa đơn gói dịch vụ</h1>
          <p className="mt-1 text-sm text-stone-500">Theo dõi hóa đơn và tình trạng thanh toán đồng bộ từ BOBAPOS.</p>
        </div>
        {platformCapabilities.canManageBillingRecords ? (
          <Link className="rounded-xl bg-[#2F80ED] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2569c7]" href="/contracts/new">Tạo bản ghi thanh toán</Link>
        ) : <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">Hóa đơn từ BOBAPOS · chỉ xem</span>}
      </div>
      <ContractTable />
    </div>
  );
}
