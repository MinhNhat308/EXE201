'use client';

import { ReactNode } from 'react';
import { Role } from '@/models/user.model';
import { AppShellLayout, type NavItem } from '@/views/components/AppShellLayout';

const NAV: NavItem[] = [
  { href: '/dashboard/accounting', label: 'Tổng quan', icon: '🏠', exact: true },
  { href: '/dashboard/accounting/shifts', label: 'Quản lý ca NV', icon: '⏱️' },
  { href: '/dashboard/accounting/reports', label: 'Báo cáo doanh thu', icon: '📊' },
  { href: '/dashboard/accounting/supplier', label: 'Nhập NCC', icon: '🏭' },
  { href: '/dashboard/accounting/requests', label: 'Duyệt phiếu', icon: '✅' },
  { href: '/dashboard/accounting/returns', label: 'Danh sách hoàn trả', icon: '📋' },
  { href: '/dashboard/accounting/stock', label: 'Tồn kho', icon: '📦' },
  { href: '/dashboard/accounting/ledger', label: 'Sao kê', icon: '📑' },
];

export function AccountingLayout({ children }: { children: ReactNode }) {
  return (
    <AppShellLayout
      allowedRoles={[Role.ACCOUNTING, Role.ADMIN]}
      roleBadge="Kế toán"
      navItems={NAV}
    >
      {children}
    </AppShellLayout>
  );
}
