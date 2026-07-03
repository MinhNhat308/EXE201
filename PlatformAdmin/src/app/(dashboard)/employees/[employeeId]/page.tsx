"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import { useDeleteEmployee, useEmployee } from "@/modules/employees/api/employee.queries";
import { useTenant } from "@/modules/tenants/api/tenant.queries";

export default function EmployeeDetailPage() {
  const params = useParams<{ employeeId: string }>();
  const router = useRouter();
  const employee = useEmployee(params.employeeId);
  const tenant = useTenant(employee.data?.tenantId ?? "");
  const deleteEmployee = useDeleteEmployee();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDelete = () => {
    deleteEmployee.mutate(params.employeeId, {
      onSuccess: () => {
        setConfirmOpen(false);
        router.push("/employees");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary" href="/employees">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Link>
          <h1 className="text-3xl font-bold text-primary">Thông tin nhân viên</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted"
            href={`/employees/${params.employeeId}/edit`}
          >
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </Link>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)} disabled={deleteEmployee.isPending}>
            <Trash2 className="h-4 w-4" />
            Xóa
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>{employee.data?.fullName ?? "Loading..."}</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <p>Cửa hàng: {tenant.data ? `${tenant.data.name} (${tenant.data.ownerName})` : employee.data?.tenantId}</p>
          <p>Email: {employee.data?.email}</p>
          <p>Role: {employee.data?.role}</p>
          <p>Department: {employee.data?.department}</p>
          <p>Status: {employee.data ? <StatusBadge status={employee.data.status} /> : null}</p>
          <p>Last login: {employee.data?.lastLoginAt ?? "N/A"}</p>
        </CardContent>
      </Card>
      <ConfirmDialog
        open={confirmOpen}
        title="Xóa nhân viên"
        description="Thao tác này không thể hoàn tác. Nhân viên sẽ bị xóa khỏi hệ thống."
        isLoading={deleteEmployee.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
