"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ArrowRight, CalendarDays, Check, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/common/status-badge";
import { contractApi } from "@/modules/contracts/api/contract.api";
import { useContract } from "@/modules/contracts/api/contract.queries";

const planLabels: Record<string, string> = {
  saas_subscription: "SaaS Subscription",
  franchise: "Franchise",
  support: "Support"
};

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN");
}

function formatAmount(value?: number) {
  if (value === undefined) return "—";
  return `${new Intl.NumberFormat("vi-VN").format(value)} VNĐ`;
}

export default function ContractSuccessPage() {
  const searchParams = useSearchParams();
  const contractId = searchParams.get("id") ?? "";
  const contract = useContract(contractId);
  const [downloading, setDownloading] = useState(false);

  if (!contractId) {
    return (
      <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">Không tìm thấy thông tin hợp đồng. Vui lòng tạo hợp đồng mới.</p>
      </div>
    );
  }

  const data = contract.data;

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center py-10">
      <section className="w-full max-w-[500px] rounded-2xl bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.12)] dark:bg-slate-950">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500 text-white">
            <Check className="h-6 w-6" />
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-bold text-slate-950 dark:text-white">Tạo hợp đồng thành công</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
          {contract.isLoading
            ? "Đang tải thông tin hợp đồng..."
            : (
              <>
                Hợp đồng với <strong className="text-slate-900 dark:text-white">{data?.ownerName}</strong> đã được tạo và gửi bản điện tử thành công.
              </>
            )}
        </p>

        {data ? (
          <div className="mt-7 space-y-3 rounded-2xl bg-slate-50 p-4 text-left dark:bg-slate-900">
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 dark:bg-slate-950">
              <div>
                <p className="text-[10px] font-extrabold uppercase text-slate-500">Mã hợp đồng</p>
                <p className="mt-1 font-extrabold text-slate-950 dark:text-white">{data.code}</p>
              </div>
              <StatusBadge status={data.status} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white p-4 dark:bg-slate-950">
                <p className="text-[10px] font-extrabold uppercase text-slate-500">Gói dịch vụ</p>
                <p className="mt-1 text-sm font-bold">{planLabels[data.plan] ?? data.plan}</p>
                <p className="text-xs text-slate-500">{data.durationMonths ?? 12} tháng</p>
              </div>
              <div className="rounded-xl bg-white p-4 dark:bg-slate-950">
                <p className="text-[10px] font-extrabold uppercase text-slate-500">Giá trị</p>
                <p className="mt-1 text-sm font-extrabold text-primary">{formatAmount(data.amount)}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 rounded-xl bg-white px-4 py-3 text-xs text-slate-600 dark:bg-slate-950 dark:text-slate-300">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                Ngày ký: {formatDate(data.startDate)}
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Loại: {planLabels[data.plan] ?? data.plan}
              </span>
            </div>
          </div>
        ) : null}

        <div className="mt-7 space-y-3">
          {data ? (
            <Link className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary/90" href={`/contracts/${data.id}`}>
              Xem chi tiết hợp đồng
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="outline"
              className="h-11 rounded-xl bg-white dark:bg-slate-950"
              disabled={!data || downloading}
              onClick={async () => {
                if (!data) return;
                setDownloading(true);
                try {
                  await contractApi.downloadPdf(data.id, `${data.code}.pdf`);
                } finally {
                  setDownloading(false);
                }
              }}
            >
              <FileText className="h-4 w-4" />
              {downloading ? "Đang tải..." : "Tải bản PDF"}
            </Button>
            <Link className="inline-flex h-11 items-center justify-center rounded-xl text-sm font-bold text-slate-700 hover:bg-muted dark:text-slate-300" href="/contracts">
              Quay về danh sách
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
