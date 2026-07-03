"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, Edit, Eye, FileText, Mail, Paperclip, Printer, Search, Trash2, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { useContract, useDeleteContract } from "@/modules/contracts/api/contract.queries";
import { contractApi } from "@/modules/contracts/api/contract.api";

function formatAmount(amount?: number) {
  return new Intl.NumberFormat("vi-VN").format(amount ?? 48000000);
}

export default function ContractDetailPage() {
  const params = useParams<{ contractId: string }>();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const contract = useContract(params.contractId);
  const deleteContract = useDeleteContract();
  const data = contract.data;
  const code = data?.code ?? "#CNT-2024-081";
  const ownerName = data?.ownerName ?? "Emerald Tea Co.";
  const plan = data?.plan ?? "SaaS Subscription";

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link href="/tenants" className="hover:text-primary">Người thuê</Link>
          <span>/</span>
          <Link href="/contracts" className="hover:text-primary">Hợp đồng</Link>
          <span>/</span>
          <span className="text-primary">{code}</span>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-3xl font-extrabold text-primary">Hợp đồng Thuê phần mềm - {ownerName}</h1>
          <div className="flex items-center gap-3">
            {data ? <StatusBadge status={data.status} /> : <span className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white">Active</span>}
            <span className="rounded-full bg-blue-100 px-4 py-1.5 text-xs font-bold text-primary dark:bg-blue-500/10">Signed {data?.startDate ?? "Oct 12, 2024"}</span>
            {data ? (
              <>
                <Link className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:border-primary/30 hover:text-primary" href={`/contracts/${data.id}/edit`}>
                  <Edit className="h-4 w-4" />
                  Sửa
                </Link>
                <Button className="h-9 gap-2" variant="destructive" onClick={() => setDeleteOpen(true)}>
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_250px]">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6 text-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-5 text-slate-700 dark:text-slate-300">
              <Search className="h-4 w-4" />
              <span className="font-bold">100%</span>
              <ZoomIn className="h-4 w-4" />
              <Printer className="h-4 w-4" />
              <Search className="h-4 w-4" />
            </div>
            <p className="text-xs font-semibold text-slate-500">Page 1 of 12</p>
          </div>

          <div className="flex justify-center p-8">
            <article className="min-h-[660px] w-full max-w-[620px] bg-white px-16 py-14 shadow-sm dark:bg-slate-950">
              <h2 className="text-center text-2xl font-extrabold uppercase tracking-[0.16em] text-primary">Thỏa thuận dịch vụ</h2>
              <div className="mx-auto mt-6 h-px w-full bg-slate-200 dark:bg-slate-800" />
              <p className="mt-5 text-center text-xs font-bold uppercase text-slate-600 dark:text-slate-300">Contract Ref: {code}</p>

              <section className="mt-14 space-y-8 text-sm leading-7 text-slate-700 dark:text-slate-300">
                <div>
                  <h3 className="text-lg font-extrabold uppercase text-primary">Điều khoản 1. Các bên</h3>
                  <p className="mt-4">
                    This Software Service Agreement is made and entered into as of October 12, 2024, by and between
                    <strong> TeaChain Admin Services</strong> and <strong>{ownerName}</strong>.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold uppercase text-primary">1.1 Điều khoản cấp phép</h3>
                  <p className="mt-4">
                    Provider grants Tenant a non-exclusive, non-transferable right to access and use the TeaChain
                    Management Platform. The license is granted solely for internal business operations for the
                    duration of the subscription term.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold uppercase text-primary">1.2 Lịch thanh toán</h3>
                  <p className="mt-4">
                    Service fees are payable in advance on a monthly basis. Late payments shall accrue interest at a
                    rate of 1.5% per month or the highest rate permitted by law, whichever is lower.
                  </p>
                </div>
              </section>
            </article>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-lg bg-white p-5 shadow-sm dark:bg-slate-950">
            <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-primary">
              <Eye className="h-4 w-4" />
              Contract Details
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">Mã số hợp đồng</p>
                <p className="mt-1 font-extrabold text-primary">{code}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">Tên người thuê</p>
                <p className="mt-1 font-bold">{ownerName}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">Thời hạn</p>
                <p className="mt-1 font-bold">{data?.durationMonths ? `${data.durationMonths} tháng` : "—"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">Gói dịch vụ</p>
                <p className="mt-1 font-bold">{plan}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">Lần gia hạn tiếp theo</p>
                <p className="mt-1 font-extrabold text-primary">{data?.endDate ?? "Oct 12, 2026"}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-slate-500">Giá trị</p>
                <p className="mt-1 font-extrabold">{formatAmount(data?.amount)} VNĐ</p>
              </div>
              {data?.additionalTerms ? (
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-500">Điều khoản bổ sung</p>
                  <p className="mt-1 whitespace-pre-wrap text-slate-600 dark:text-slate-300">{data.additionalTerms}</p>
                </div>
              ) : null}
            </div>
          </div>

          <Button
            className="h-12 w-full justify-start rounded-lg"
            disabled={!data || downloadingPdf}
            onClick={async () => {
              if (!data) return;
              setDownloadingPdf(true);
              try {
                await contractApi.downloadPdf(data.id, `${data.code}.pdf`);
              } finally {
                setDownloadingPdf(false);
              }
            }}
          >
            <Download className="h-4 w-4" />
            {downloadingPdf ? "Đang tải PDF..." : "Tải xuống (PDF)"}
          </Button>
          <Button className="h-12 w-full justify-start rounded-lg">
            <FileText className="h-4 w-4" />
            Tải xuống (DOCX)
          </Button>
          <Button variant="outline" className="h-14 w-full justify-start rounded-lg bg-white dark:bg-slate-950">
            <Mail className="h-4 w-4" />
            Gửi email cho khách hàng
          </Button>

          <div className="space-y-3">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">Related files</p>
            {["Schedule_A_Pricing.pdf", "ID_Verification.jpg"].map((file) => (
              <div key={file} className="flex items-center gap-3 rounded-lg bg-white p-3 text-sm shadow-sm dark:bg-slate-950">
                <Paperclip className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-bold text-primary">{file}</p>
                  <p className="text-xs text-slate-500">2.4 MB - Updated 2d ago</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
      {data ? (
        <ConfirmDialog
          open={deleteOpen}
          title="Delete contract"
          description={`Delete contract ${data.code}? This action cannot be undone.`}
          isLoading={deleteContract.isPending}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => deleteContract.mutate(data.id, { onSuccess: () => router.push("/contracts") })}
        />
      ) : null}
    </div>
  );
}
