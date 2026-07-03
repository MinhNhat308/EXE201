"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { useTenants } from "@/modules/tenants/api/tenant.queries";
import { useTenantTableStore } from "@/modules/tenants/stores/tenant-table.store";
import type { TenantDto } from "@/modules/tenants/types/tenant.types";

const columns: ColumnDef<TenantDto>[] = [
  { accessorKey: "name", header: "Tenant", cell: ({ row }) => <Link className="font-semibold text-primary" href={`/tenants/${row.original.id}`}>{row.original.name}</Link> },
  { accessorKey: "ownerName", header: "Owner" },
  { accessorKey: "plan", header: "Plan" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "createdAt", header: "Created" }
];

export function TenantTable() {
  const tableState = useTenantTableStore();
  const query = useTenants({
    page: tableState.page,
    limit: tableState.limit,
    search: tableState.search,
    sortBy: tableState.sortBy,
    sortOrder: tableState.sortOrder,
    filters: tableState.filters
  });

  return (
    <DataTable
      columns={columns}
      data={query.data?.data ?? []}
      totalPages={query.data?.meta.totalPages ?? 1}
      state={tableState}
      isLoading={query.isLoading}
      onStateChange={tableState.setTableState}
      filterOptions={[
        { key: "status", label: "Status", options: ["active", "pending", "inactive", "suspended"].map((value) => ({ label: value, value })) },
        { key: "plan", label: "Plan", options: ["starter", "premium", "enterprise"].map((value) => ({ label: value, value })) }
      ]}
    />
  );
}
