'use client';

import { useEffect } from 'react';
import type { StoreReportBundle, StoreReportTabId } from '@/models/store-report.model';
import { WorkShift } from '@/models/staff.model';
import { ReportDocumentShell } from '@/views/store/reports/ReportDocumentShell';
import { ReportViewProvider } from '@/views/store/reports/ReportViewContext';
import { STORE_REPORT_TABS } from '@/views/store/reports/report-definitions';
import { renderReportTabContent } from '@/views/store/reports/report-tab-panels';

type Props = {
  bundle: StoreReportBundle;
  activeTab: StoreReportTabId;
  shiftFilter: WorkShift | 'ALL';
  onClose: () => void;
  onPrint: () => void;
};

export function ReportPreviewModal({
  bundle,
  activeTab,
  shiftFilter,
  onClose,
  onPrint,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const tab = STORE_REPORT_TABS.find((t) => t.id === activeTab);
  if (!tab) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-stone-900/60 backdrop-blur-sm print:relative print:inset-auto print:bg-white print:backdrop-blur-none">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 bg-white px-4 py-3 print:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#2F80ED]">
            Xem trước báo cáo
          </p>
          <p className="text-sm font-bold text-stone-900">{tab.label}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPrint}
            className="rounded-xl bg-[#2F80ED] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#2563c7]"
          >
            🖨️ In báo cáo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            Đóng
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 print:overflow-visible print:p-0 sm:p-8">
        <div className="report-document-print-root mx-auto max-w-[210mm] rounded-lg bg-white shadow-2xl print:max-w-none print:rounded-none print:shadow-none">
          <div className="p-6 sm:p-10 print:p-8">
            <ReportViewProvider mode="document">
              <ReportDocumentShell bundle={bundle} tab={tab} shiftFilter={shiftFilter}>
                {renderReportTabContent(activeTab, bundle)}
              </ReportDocumentShell>
            </ReportViewProvider>
          </div>
        </div>
      </div>
    </div>
  );
}
