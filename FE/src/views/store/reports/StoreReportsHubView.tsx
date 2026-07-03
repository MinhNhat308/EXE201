'use client';

import { ReactNode, useCallback, useEffect, useState } from 'react';
import { ReportsController } from '@/controllers/reports.controller';
import { exportStoreReportBundle } from '@/lib/excel-export';
import { ApiError } from '@/lib/api';
import { getStoredTenant, getStoredUser } from '@/lib/auth-storage';
import { localDateString } from '@/lib/local-date';
import { Role } from '@/models/user.model';
import type { StoreReportBundle, StoreReportTabId } from '@/models/store-report.model';
import { STORE_REPORT_TAB_GROUPS } from '@/models/store-report.model';
import { WORK_SHIFT_LABELS, WorkShift } from '@/models/staff.model';
import { useActiveBranch, BRANCH_CHANGE_EVENT, publishBranchChange } from '@/lib/use-active-branch';
import { isChainOperatingPlan } from '@/lib/workspace-routes';
import { BranchesController } from '@/controllers/branches.controller';
import type { Branch } from '@/models/branch.model';
import { SubscriptionPlan, TenantInfo } from '@/models/tenant.model';
import { getStoredPlan } from '@/lib/auth-storage';
import { ReportPreviewModal } from '@/views/store/reports/ReportPreviewModal';
import { ReportViewProvider } from '@/views/store/reports/ReportViewContext';
import { renderReportTabContent } from '@/views/store/reports/report-tab-panels';
import {
  STORE_REPORT_TABS,
  buildExcelSheets,
} from '@/views/store/reports/report-definitions';

type Props = {
  title: string;
  description: string;
  layout: (children: ReactNode) => ReactNode;
};

const SHIFT_FILTERS: { key: WorkShift | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả ca' },
  ...Object.values(WorkShift).map((s) => ({ key: s, label: WORK_SHIFT_LABELS[s] })),
];

export function StoreReportsHubView({ title, description, layout }: Props) {
  const tenant = getStoredTenant<TenantInfo>();
  const today = localDateString();

  const [date, setDate] = useState(today);
  const [shiftFilter, setShiftFilter] = useState<WorkShift | 'ALL'>('ALL');
  const [activeTab, setActiveTab] = useState<StoreReportTabId>('summary');
  const [bundle, setBundle] = useState<StoreReportBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<string | 'ALL'>('ALL');
  const isChain = isChainOperatingPlan(tenant, getStoredPlan() ?? SubscriptionPlan.STANDARD);
  const { branchId: activeBranchId, version: branchVersion } = useActiveBranch();

  useEffect(() => {
    if (!isChain) return;
    BranchesController.list(true)
      .then((rows) => setBranches(rows))
      .catch(() => undefined);
  }, [isChain]);

  useEffect(() => {
    if (!isChain || !activeBranchId) return;
    setBranchId(activeBranchId);
  }, [isChain, activeBranchId, branchVersion]);

  useEffect(() => {
    if (!isChain) return;
    const onBranch = (e: Event) => {
      const detail = (e as CustomEvent<{ id: string }>).detail;
      if (detail?.id) setBranchId(detail.id);
    };
    window.addEventListener(BRANCH_CHANGE_EVENT, onBranch);
    return () => window.removeEventListener(BRANCH_CHANGE_EVENT, onBranch);
  }, [isChain]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ReportsController.getStoreBundle(
        date,
        shiftFilter === 'ALL' ? undefined : shiftFilter,
        isChain && branchId !== 'ALL' ? branchId : undefined,
      );
      setBundle(data);
      setError('');
    } catch (err) {
      const role = getStoredUser<{ role?: Role }>()?.role;
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setError(
            role === Role.STAFF || role === Role.KITCHEN
              ? 'Thu ngân / Bếp không xem được báo cáo. Đăng nhập manager, accounting hoặc chủ quán.'
              : err.message || 'Bạn không có quyền xem báo cáo cửa hàng này.',
          );
        } else if (err.status === 401) {
          setError('Phiên đăng nhập hết hạn. Vui lòng đăng xuất và đăng nhập lại.');
        } else if (err.status === 0) {
          setError(err.message);
        } else {
          setError(err.message || 'Không tải được báo cáo.');
        }
      } else {
        setError('Không tải được báo cáo. Kiểm tra BE đã chạy (port 3001) và quyền truy cập.');
      }
    } finally {
      setLoading(false);
    }
  }, [date, shiftFilter, isChain, branchId, branchVersion]);

  useEffect(() => {
    void load();
  }, [load]);

  const storeLabel = bundle?.meta.storeName ?? tenant?.storeName ?? 'Cua_hang';
  const activeTabDef = STORE_REPORT_TABS.find((t) => t.id === activeTab);

  const handleExportTab = () => {
    if (!bundle) return;
    exportStoreReportBundle(buildExcelSheets(bundle, activeTab), storeLabel, date);
  };

  const handleExportAll = () => {
    if (!bundle) return;
    exportStoreReportBundle(buildExcelSheets(bundle), storeLabel, date);
  };

  const handlePrint = () => window.print();

  const content = (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-56">
        <nav className="space-y-4 rounded-2xl border bg-white p-2 shadow-sm">
          {STORE_REPORT_TAB_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.tabs.map((tabId) => {
                  const tab = STORE_REPORT_TABS.find((t) => t.id === tabId);
                  if (!tab) return null;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition ${
                        activeTab === tab.id
                          ? 'bg-[#2F80ED] text-white shadow-sm'
                          : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span className="font-semibold leading-tight">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">{title}</h1>
            <p className="mt-1 text-sm text-stone-500">{description}</p>
            {bundle && (
              <p className="mt-1 text-xs text-stone-400">
                {bundle.meta.storeName && (
                  <strong className="text-stone-600">{bundle.meta.storeName}</strong>
                )}
                {' · '}
                {new Date(bundle.meta.date + 'T12:00:00').toLocaleDateString('vi-VN', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {' · '}
                Cập nhật{' '}
                {new Date(bundle.meta.generatedAt).toLocaleTimeString('vi-VN')}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              disabled={!bundle || loading}
              className="rounded-xl bg-[#2F80ED] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-[#2563c7] disabled:opacity-50"
            >
              👁 Xem báo cáo
            </button>
            <button
              type="button"
              onClick={handleExportTab}
              disabled={!bundle || loading}
              className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
            >
              📥 Excel tab này
            </button>
            <button
              type="button"
              onClick={handleExportAll}
              disabled={!bundle || loading}
              className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium hover:bg-stone-50 disabled:opacity-50"
            >
              📥 Excel đầy đủ
            </button>
          </div>
        </div>

        {bundle && activeTabDef && (
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-white px-4 py-3 text-sm text-blue-900">
            <strong>{activeTabDef.icon} {activeTabDef.label}</strong>
            <span className="text-blue-800/70"> — {activeTabDef.description}. </span>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="font-semibold text-[#2F80ED] underline-offset-2 hover:underline"
            >
              Xem dạng báo cáo in →
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-end gap-4 rounded-2xl border bg-white p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-stone-400">
              Ngày
            </label>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-stone-400">
              Ca
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SHIFT_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setShiftFilter(f.key)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    shiftFilter === f.key
                      ? 'bg-[#2F80ED] text-white'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          {isChain && branches.length > 0 && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase text-stone-400">
                Chi nhánh
              </label>
              <select
                value={branchId}
                onChange={(e) => {
                  const next = e.target.value as string | 'ALL';
                  setBranchId(next);
                  if (next !== 'ALL') {
                    const b = branches.find((x) => x.id === next);
                    if (b) {
                      publishBranchChange({ id: b.id, code: b.code, name: b.name });
                    }
                  }
                }}
                className="rounded-xl border border-stone-200 px-3 py-2 text-sm"
              >
                <option value="ALL">Tất cả CN (chuỗi)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.code} — {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
          >
            🔄 Tải lại
          </button>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        )}

        {loading && (
          <div className="animate-pulse space-y-4">
            <div className="h-32 rounded-2xl bg-stone-100" />
            <div className="h-64 rounded-2xl bg-stone-100" />
          </div>
        )}

        {!loading && bundle && (
          <ReportViewProvider mode="screen">
            <div className="space-y-6">{renderReportTabContent(activeTab, bundle)}</div>
          </ReportViewProvider>
        )}
      </div>

      {previewOpen && bundle && (
        <ReportPreviewModal
          bundle={bundle}
          activeTab={activeTab}
          shiftFilter={shiftFilter}
          onClose={() => setPreviewOpen(false)}
          onPrint={handlePrint}
        />
      )}
    </div>
  );

  return layout(content);
}
