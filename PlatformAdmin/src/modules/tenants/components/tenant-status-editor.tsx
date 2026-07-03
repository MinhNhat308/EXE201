"use client";

import { StatusBadge } from "@/components/common/status-badge";
import { Select } from "@/components/ui/select";
import { useUpdateTenant } from "@/modules/tenants/api/tenant.queries";
import type { TenantStatus } from "@/modules/tenants/types/tenant.types";

const statusOptions: { value: TenantStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" }
];

export function TenantStatusEditor({ tenantId, status }: { tenantId: string; status: TenantStatus }) {
  const updateTenant = useUpdateTenant(tenantId);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <StatusBadge status={status} />
      <Select
        aria-label="Owner status"
        className="h-9 w-40"
        disabled={updateTenant.isPending}
        value={status}
        onChange={(event) => updateTenant.mutate({ status: event.target.value as TenantStatus })}
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
