'use client';



import { ReactNode } from 'react';

import { Role } from '@/models/user.model';

import { AppShellLayout, type NavItem } from '@/views/components/AppShellLayout';



const NAV: NavItem[] = [

  { href: '/dashboard/warehouse', label: 'Tổng quan', icon: '🏠', exact: true },

  { href: '/dashboard/warehouse/replenish', label: 'Bổ sung tồn', icon: '🔄' },

  { href: '/dashboard/warehouse/returns', label: 'Thu hồi về kho tổng', icon: '📥' },

  { href: '/dashboard/warehouse/supplier', label: 'Phiếu NCC', icon: '🏭' },

  { href: '/dashboard/warehouse/requests', label: 'Danh sách phiếu', icon: '📋' },

  { href: '/dashboard/warehouse/stock', label: 'Tồn kho', icon: '📦' },

  { href: '/dashboard/warehouse/usage', label: 'Tiêu hao ngày', icon: '📊' },

];



export function WarehouseLayout({ children }: { children: ReactNode }) {

  return (

    <AppShellLayout

      allowedRoles={[Role.WAREHOUSE, Role.ADMIN]}

      roleBadge="Nhân viên kho"

      navItems={NAV}

    >

      {children}

    </AppShellLayout>

  );

}


