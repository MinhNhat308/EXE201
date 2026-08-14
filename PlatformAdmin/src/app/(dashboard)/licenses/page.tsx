"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { LicenseTable } from "@/modules/licenses/components/license-table";

export default function LicensesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2F80ED]">Software licenses</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">Licenses</h1>
          <p className="mt-1 text-sm text-stone-500">Quản lý license phần mềm theo cửa hàng và gói dịch vụ.</p>
        </div>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2F80ED] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2569c7]"
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
