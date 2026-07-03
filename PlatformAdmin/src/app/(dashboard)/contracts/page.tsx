import Link from "next/link";
import { ContractTable } from "@/modules/contracts/components/contract-table";

export default function ContractsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Contracts</p>
          <h1 className="text-3xl font-bold text-primary">Danh sách hợp đồng</h1>
          <p className="text-muted-foreground">Quản lý hồ sơ dịch vụ, ngày hiệu lực và tình trạng thanh toán.</p>
        </div>
        <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href="/contracts/new">Tạo hợp đồng mới</Link>
      </div>
      <ContractTable />
    </div>
  );
}
