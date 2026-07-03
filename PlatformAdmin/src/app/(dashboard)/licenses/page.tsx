"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { LicenseTable } from "@/modules/licenses/components/license-table";

export default function LicensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Software licenses</p>
          <h1 className="text-3xl font-bold text-primary">Licenses</h1>
          <p className="text-muted-foreground">Quản lý license phần mềm theo cửa hàng và gói dịch vụ.</p>
        </div>
        <Link
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          href="/licenses/new"
        >
          <Plus className="h-4 w-4" />
          Tạo license
        </Link>
      </div>
      <LicenseTable />
    </div>
  );
}
