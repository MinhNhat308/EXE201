import Link from "next/link";
import { OwnerTable } from "@/modules/owners/components/owner-table";

export default function OwnersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Owners</p>
          <h1 className="text-3xl font-bold text-primary">Danh sách chủ cửa hàng</h1>
          <p className="text-muted-foreground">Quản lý thông tin chủ sở hữu, cửa hàng liên kết, gói dịch vụ và key kích hoạt.</p>
        </div>
        <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href="/owners/new">
          Tạo owner mới
        </Link>
      </div>
      <OwnerTable />
    </div>
  );
}
