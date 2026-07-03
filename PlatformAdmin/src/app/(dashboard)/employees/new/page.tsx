"use client";

import { useRouter } from "next/navigation";
import { EmployeeForm } from "@/modules/employees/components/employee-form";
import { useCreateEmployee } from "@/modules/employees/api/employee.queries";

export default function NewEmployeePage() {
  const router = useRouter();
  const createEmployee = useCreateEmployee();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-primary">Đăng ký nhân viên</h1>
      <EmployeeForm
        isSubmitting={createEmployee.isPending}
        onSubmit={(values) => createEmployee.mutate(values, { onSuccess: () => router.push("/employees") })}
      />
    </div>
  );
}
