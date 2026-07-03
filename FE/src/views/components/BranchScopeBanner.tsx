'use client';

import { useBranchScopeLabel } from '@/lib/use-active-branch';
import { BRAND } from '@/lib/brand';

export function BranchScopeBanner() {
  const label = useBranchScopeLabel();
  if (!label) return null;

  return (
    <div
      className={`border-b px-4 py-2.5 text-sm sm:px-6 ${BRAND.primarySoft} border-[#2F80ED]/20`}
    >
      <span className="font-medium text-[#1a4a8a]">Đang xem chi nhánh:</span>{' '}
      <strong className="text-stone-900">{label}</strong>
      <span className="ml-2 text-stone-600">
        — Kho, báo cáo và đơn ca lọc theo CN này. Đổi CN ở sidebar.
      </span>
    </div>
  );
}
