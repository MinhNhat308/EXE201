import Link from "next/link";
import { EmployeeTable } from "@/modules/employees/components/employee-table";

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Quản lý nhân sự</p>
          <h1 className="text-3xl font-bold text-primary">Thư mục nhân sự</h1>
          <p className="text-muted-foreground">Quản lý quyền truy cập và trạng thái tài khoản nhân viên.</p>
        </div>
        <Link className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white" href="/employees/new">Thêm nhân viên</Link>
      </div>
      <EmployeeTable />
    </div>
  );
}
