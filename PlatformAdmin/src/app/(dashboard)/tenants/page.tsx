import Link from "next/link";
import { TenantTable } from "@/modules/tenants/components/tenant-table";

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Stores</p>
          <h1 className="text-3xl font-bold text-primary">Danh sách cửa hàng</h1>
          <p className="text-muted-foreground">Giám sát hồ sơ, owner, trạng thái và quyền truy cập của từng cửa hàng.</p>
        </div>
        <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href="/tenants/new">
          Thêm cửa hàng mới
        </Link>
      </div>
      <TenantTable />
    </div>
  );
}
