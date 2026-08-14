"use client";

import Link from "next/link";
import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Edit, ReceiptText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { platformCapabilities } from "@/config/capabilities";
import { contractApi } from "@/modules/contracts/api/contract.api";
import { useContract, useDeleteContract } from "@/modules/contracts/api/contract.queries";

const formatCurrency = (amount?: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount ?? 0);
const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString("vi-VN") : "—";

export default function BillingInvoiceDetailPage() {
  const params = useParams<{ contractId: string }>();
  const router = useRouter();
  const invoice = useContract(params.contractId);
  const removeInvoice = useDeleteContract();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const data = invoice.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/contracts" className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
          </Link>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">BOBAPOS Billing</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">Chi tiết hóa đơn gói dịch vụ</h1>
        </div>
        {data ? <StatusBadge status={data.status} /> : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-primary" />{data?.code ?? "Đang tải..."}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">Chủ cửa hàng</p><p className="mt-1 font-semibold">{data?.ownerName ?? "—"}</p></div>
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">Gói</p><p className="mt-1 font-semibold uppercase">{data?.plan ?? "—"}</p></div>
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">Giá trị</p><p className="mt-1 font-semibold text-primary">{formatCurrency(data?.amount)}</p></div>
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">Từ ngày</p><p className="mt-1 font-semibold">{formatDate(data?.startDate)}</p></div>
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">Đến ngày</p><p className="mt-1 font-semibold">{formatDate(data?.endDate)}</p></div>
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">Phương thức</p><p className="mt-1 font-semibold">{data?.paymentMethod ?? "—"}</p></div>
          {data?.additionalTerms ? <div className="sm:col-span-2 lg:col-span-3"><p className="text-xs font-semibold uppercase text-muted-foreground">Ghi chú</p><p className="mt-1 whitespace-pre-wrap">{data.additionalTerms}</p></div> : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={!data || downloadingPdf}
          onClick={async () => {
            if (!data) return;
            setDownloadingPdf(true);
            try { await contractApi.downloadPdf(data.id, `${data.code}.pdf`); } finally { setDownloadingPdf(false); }
          }}
        >
          <Download className="h-4 w-4" /> {downloadingPdf ? "Đang tải..." : "Tải PDF"}
        </Button>
        {data && platformCapabilities.canManageBillingRecords ? (
          <>
            <Link className="inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-semibold" href={`/contracts/${data.id}/edit`}><Edit className="h-4 w-4" />Sửa</Link>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}><Trash2 className="h-4 w-4" />Xóa</Button>
          </>
        ) : null}
      </div>

      {data && platformCapabilities.canManageBillingRecords ? (
        <ConfirmDialog
          open={deleteOpen}
          title="Xóa bản ghi thanh toán"
          description={`Xóa ${data.code}? Thao tác này không thể hoàn tác.`}
          isLoading={removeInvoice.isPending}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => removeInvoice.mutate(data.id, { onSuccess: () => router.push("/contracts") })}
        />
      ) : null}
    </div>
  );
}
