import Link from "next/link";
import { TenantTable } from "@/modules/tenants/components/tenant-table";
import { platformCapabilities } from "@/config/capabilities";

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2F80ED]">Stores</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Danh sách cửa hàng</h1>
          <p className="mt-1 text-sm text-stone-500">Giám sát hồ sơ, owner, trạng thái và quyền truy cập của từng cửa hàng.</p>
        </div>
        {platformCapabilities.canCreateTenant ? (
          <Link className="rounded-xl bg-[#2F80ED] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2569c7]" href="/tenants/new">Thêm cửa hàng mới</Link>
        ) : <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">Cửa hàng đăng ký từ BOBAPOS</span>}
      </div>
      <TenantTable />
    </div>
  );
}
