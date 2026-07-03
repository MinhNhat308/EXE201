"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { useEmployees } from "@/modules/employees/api/employee.queries";
import { useEmployeeTableStore } from "@/modules/employees/stores/employee-table.store";
import type { EmployeeDto } from "@/modules/employees/types/employee.types";

const columns: ColumnDef<EmployeeDto>[] = [
  { accessorKey: "fullName", header: "Employee", cell: ({ row }) => <Link className="font-semibold text-primary" href={`/employees/${row.original.id}`}>{row.original.fullName}</Link> },
  { accessorKey: "email", header: "Email" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "department", header: "Department" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "lastLoginAt", header: "Last login" }
];

export function EmployeeTable() {
  const tableState = useEmployeeTableStore();
  const query = useEmployees(tableState);

  return (
    <DataTable
      columns={columns}
      data={query.data?.data ?? []}
      totalPages={query.data?.meta.totalPages ?? 1}
      state={tableState}
      isLoading={query.isLoading}
      onStateChange={tableState.setTableState}
      filterOptions={[
        { key: "status", label: "Status", options: ["active", "pending", "inactive"].map((value) => ({ label: value, value })) },
        { key: "role", label: "Role", options: ["admin", "manager", "staff"].map((value) => ({ label: value, value })) }
      ]}
    />
  );
}
