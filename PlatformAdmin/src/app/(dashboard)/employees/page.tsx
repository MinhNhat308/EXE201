import Link from "next/link";
import { EmployeeTable } from "@/modules/employees/components/employee-table";
import { platformCapabilities } from "@/config/capabilities";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2F80ED]">Quản lý nhân sự</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Thư mục nhân sự</h1>
          <p className="mt-1 text-sm text-stone-500">Quản lý quyền truy cập và trạng thái tài khoản nhân viên.</p>
        </div>
        {platformCapabilities.canManageEmployees ? (
          <Link className="rounded-xl bg-[#2F80ED] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2569c7]" href="/employees/new">Thêm nhân viên</Link>
        ) : <span className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-500">Chỉ xem · quản lý tại BOBAPOS</span>}
      </div>
      <EmployeeTable />
    </div>
  );
}
