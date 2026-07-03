"use client";

import Link from "next/link";
import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { DataTable } from "@/components/common/data-table";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { useContracts, useDeleteContract } from "@/modules/contracts/api/contract.queries";
import { useContractTableStore } from "@/modules/contracts/stores/contract-table.store";
import type { ContractDto } from "@/modules/contracts/types/contract.types";

function ContractActions({ contract }: { contract: ContractDto }) {
  const [open, setOpen] = useState(false);
  const deleteContract = useDeleteContract();

  return (
    <div className="flex items-center gap-2">
      <Link
        aria-label="Edit contract"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:border-primary/30 hover:text-primary"
        href={`/contracts/${contract.id}/edit`}
      >
        <Edit className="h-4 w-4" />
      </Link>
      <Button aria-label="Delete contract" className="h-9 w-9 p-0" variant="destructive" onClick={() => setOpen(true)}>
        <Trash2 className="h-4 w-4" />
      </Button>
      <ConfirmDialog
        open={open}
        title="Delete contract"
        description={`Delete contract ${contract.code}? This action cannot be undone.`}
        isLoading={deleteContract.isPending}
        onCancel={() => setOpen(false)}
        onConfirm={() => deleteContract.mutate(contract.id, { onSuccess: () => setOpen(false) })}
      />
    </div>
  );
}

const columns: ColumnDef<ContractDto>[] = [
  { accessorKey: "code", header: "Code", cell: ({ row }) => <Link className="font-semibold text-primary" href={`/contracts/${row.original.id}`}>{row.original.code}</Link> },
  { accessorKey: "ownerName", header: "Owner" },
  { accessorKey: "plan", header: "Plan" },
  { accessorKey: "startDate", header: "Start" },
  { accessorKey: "endDate", header: "End" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "amount", header: "Amount", cell: ({ row }) => new Intl.NumberFormat("vi-VN").format(row.original.amount) },
  { id: "actions", header: "Actions", enableSorting: false, cell: ({ row }) => <ContractActions contract={row.original} /> }
];

export function ContractTable() {
  const tableState = useContractTableStore();
  const query = useContracts(tableState);

  return (
    <DataTable
      columns={columns}
      data={query.data?.data ?? []}
      totalPages={query.data?.meta.totalPages ?? 1}
      state={tableState}
      isLoading={query.isLoading}
      onStateChange={tableState.setTableState}
      filterOptions={[
        { key: "status", label: "Status", options: ["active", "pending", "expired", "completed"].map((value) => ({ label: value, value })) },
        { key: "plan", label: "Plan", options: ["saas_subscription", "franchise", "support"].map((value) => ({ label: value, value })) }
      ]}
    />
  );
}
