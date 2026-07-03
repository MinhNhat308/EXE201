"use client";

import type { TenantDto } from "@/modules/tenants/types/tenant.types";

const planLabels: Record<string, string> = {
  starter: "Starter",
  premium: "Premium",
  enterprise: "Enterprise"
};

export function TenantDetailFields({ tenant }: { tenant: TenantDto }) {
  const formatCurrency = (value?: number) =>
    value !== undefined ? `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : "—";

  return (
    <>
      <p>Owner: {tenant.ownerName}</p>
      <p>Email: {tenant.ownerEmail}</p>
      <p>Phone: {tenant.ownerPhone ?? "—"}</p>
      <p>Plan: {planLabels[tenant.plan] ?? tenant.plan}</p>
      <p>Location: {tenant.location ?? "—"}</p>
      <p>Address: {tenant.address ?? "—"}</p>
      <p>Tax ID: {tenant.taxId ?? "—"}</p>
      <p>Business license: {tenant.businessLicense ?? "—"}</p>
      <p>Account role: {tenant.accountRole ?? "—"}</p>
      <p>Software version: {tenant.softwareVersion ?? "—"}</p>
      <p>Contract duration: {tenant.contractDurationMonths ? `${tenant.contractDurationMonths} tháng` : "—"}</p>
      <p>Setup fee: {formatCurrency(tenant.setupFee)}</p>
      <p>Monthly fee: {formatCurrency(tenant.monthlyFee)}</p>
      <p>Discount: {formatCurrency(tenant.discount)}</p>
      <p>Created: {new Date(tenant.createdAt).toLocaleString("vi-VN")}</p>
      <p>Updated: {new Date(tenant.updatedAt).toLocaleString("vi-VN")}</p>
    </>
  );
}
