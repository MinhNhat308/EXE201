"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmployeeForm } from "@/modules/employees/components/employee-form";
import { useEmployee, useUpdateEmployee } from "@/modules/employees/api/employee.queries";

export default function EditEmployeePage() {
    const params = useParams<{ employeeId: string }>();
    const router = useRouter();
    const employee = useEmployee(params.employeeId);
    const updateEmployee = useUpdateEmployee(params.employeeId);

    if (employee.isLoading) {
        return <div className="rounded-lg border bg-white p-8 text-sm text-muted-foreground">Loading employee...</div>;
    }

    if (!employee.data) {
        return <div className="rounded-lg border bg-white p-8 text-sm text-muted-foreground">Employee not found.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <Link href={`/employees/${params.employeeId}`} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-primary dark:text-slate-300">
                        <ArrowLeft className="h-4 w-4" />
                        Quay lại chi tiết
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-950 dark:text-white">Chỉnh sửa nhân viên {employee.data.fullName}</h1>
                </div>
                <Button form="employee-edit-form" className="w-fit min-w-44" disabled={updateEmployee.isPending}>
                    Lưu thay đổi
                </Button>
            </div>

            <EmployeeForm
                formId="employee-edit-form"
                submitLabel="Lưu thay đổi"
                showStatusField
                isSubmitting={updateEmployee.isPending}
                initialValues={{
                    tenantId: employee.data.tenantId,
                    fullName: employee.data.fullName,
                    email: employee.data.email,
                    role: employee.data.role,
                    department: employee.data.department,
                    status: employee.data.status
                }}
                onSubmit={(values) =>
                    updateEmployee.mutate(values, {
                        onSuccess: () => router.push(`/employees/${params.employeeId}`)
                    })
                }
            />
        </div>
    );
}