"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { useLicenses } from "@/modules/licenses/api/license.queries";
import { useLicenseTableStore } from "@/modules/licenses/stores/license-table.store";
import type { LicenseDto } from "@/modules/licenses/types/license.types";

const columns: ColumnDef<LicenseDto>[] = [
  {
    accessorKey: "licenseKey",
    header: "License Key",
    cell: ({ row }) => (
      <Link className="font-semibold text-primary" href={`/licenses/${row.original.id}`}>
        {row.original.licenseKey}
      </Link>
    )
  },
  { accessorKey: "plan", header: "Plan" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "maxStores", header: "Max stores" },
  { accessorKey: "issuedAt", header: "Issued" },
  { accessorKey: "expiresAt", header: "Expires" }
];

export function LicenseTable() {
  const tableState = useLicenseTableStore();
  const query = useLicenses(tableState);

  return (
    <DataTable
      columns={columns}
      data={query.data?.data ?? []}
      totalPages={query.data?.meta.totalPages ?? 1}
      state={tableState}
      isLoading={query.isLoading}
      onStateChange={tableState.setTableState}
      filterOptions={[
        {
          key: "status",
          label: "Status",
          options: ["active", "pending", "expired", "suspended"].map((value) => ({ label: value, value }))
        },
        {
          key: "plan",
          label: "Plan",
          options: ["starter", "premium", "enterprise"].map((value) => ({ label: value, value }))
        }
      ]}
    />
  );
}
