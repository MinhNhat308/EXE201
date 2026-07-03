'use client';

import type { ReactNode } from 'react';
import type { StoreReportBundle } from '@/models/store-report.model';
import { WORK_SHIFT_LABELS, WorkShift } from '@/models/staff.model';
import { STORE_REPORT_TABS, type ReportTabDef } from '@/views/store/reports/report-definitions';

type Props = {
  bundle: StoreReportBundle;
  tab: ReportTabDef;
  shiftFilter: WorkShift | 'ALL';
  children: ReactNode;
};

export function ReportDocumentShell({ bundle, tab, shiftFilter, children }: Props) {
  const cfg = bundle.eInvoiceConfig;
  const reportDate = new Date(bundle.meta.date + 'T12:00:00').toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const generated = new Date(bundle.meta.generatedAt).toLocaleString('vi-VN');
  const shiftLabel =
    shiftFilter === 'ALL' ? 'Tất cả ca' : WORK_SHIFT_LABELS[shiftFilter];

  return (
    <article className="report-document mx-auto bg-white text-stone-900">
      <header className="report-document-header border-b-2 border-stone-800 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">
              BOBAPOS · Báo cáo quản trị
            </p>
            <h1 className="mt-1 text-xl font-bold uppercase leading-tight text-stone-900">
              {cfg.storeName ?? bundle.meta.storeName ?? 'Cửa hàng'}
            </h1>
            {cfg.taxCode && (
              <p className="mt-1 text-xs text-stone-600">
                MST: <strong>{cfg.taxCode}</strong>
                {cfg.address && <> · {cfg.address}</>}
                {cfg.phone && <> · ĐT: {cfg.phone}</>}
              </p>
            )}
          </div>
          <div className="shrink-0 text-right text-xs text-stone-600">
            <p>
              Mẫu số: <strong>BC-STORE-01</strong>
            </p>
            <p>
              Ký hiệu: <strong>{cfg.invoiceSerial ?? '—'}</strong>
            </p>
            <p className="mt-1">In lúc: {generated}</p>
          </div>
        </div>

        <div className="mt-5 text-center">
          <h2 className="text-base font-bold uppercase tracking-wide text-stone-900">
            {tab.label}
          </h2>
          <p className="mt-1 text-sm text-stone-600">{tab.description}</p>
        </div>

        <div className="report-document-meta mt-4 grid grid-cols-2 gap-px overflow-hidden rounded border border-stone-300 text-xs sm:grid-cols-4">
          <MetaCell label="Ngày báo cáo" value={reportDate} />
          <MetaCell label="Ca làm việc" value={shiftLabel} />
          <MetaCell label="Mã cửa hàng" value={bundle.meta.storeName ?? '—'} />
          <MetaCell
            label="Loại báo cáo"
            value={STORE_REPORT_TABS.find((t) => t.id === tab.id)?.icon + ' ' + tab.label}
          />
        </div>
      </header>

      <div className="report-document-body mt-6 space-y-5">{children}</div>

      <footer className="report-document-footer mt-10 border-t border-stone-300 pt-6">
        <div className="grid grid-cols-3 gap-6 text-center text-xs">
          <SignBlock title="Người lập báo cáo" />
          <SignBlock title="Kế toán trưởng" />
          <SignBlock title="Giám đốc / Chủ cửa hàng" />
        </div>
        <p className="mt-6 text-center text-[10px] text-stone-400">
          Báo cáo được tạo tự động từ hệ thống BOBAPOS · {generated}
        </p>
      </footer>
    </article>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-stone-50 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase text-stone-400">{label}</p>
      <p className="mt-0.5 font-medium text-stone-800">{value}</p>
    </div>
  );
}

function SignBlock({ title }: { title: string }) {
  return (
    <div>
      <p className="font-semibold text-stone-700">{title}</p>
      <p className="mt-1 italic text-stone-400">(Ký, ghi rõ họ tên)</p>
      <div className="mx-auto mt-10 h-px w-32 bg-stone-400" />
    </div>
  );
}
