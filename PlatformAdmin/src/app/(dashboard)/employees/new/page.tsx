"use client";

import { useRouter } from "next/navigation";
import { EmployeeForm } from "@/modules/employees/components/employee-form";
import { useCreateEmployee } from "@/modules/employees/api/employee.queries";

export default function NewEmployeePage() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();

  return (
    <div className="space-y-6">
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Đăng ký nhân viên</h1>
      <EmployeeForm
        isSubmitting={createEmployee.isPending}
        onSubmit={(values) => createEmployee.mutate(values, { onSuccess: () => router.push("/employees") })}
      />
    </div>
  );
}
