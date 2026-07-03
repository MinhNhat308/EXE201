'use client';



import { ReactNode } from 'react';

import { Role } from '@/models/user.model';

import { AppShellLayout, type NavSection } from '@/views/components/AppShellLayout';



const NAV_SECTIONS: NavSection[] = [

  {

    label: 'Tổng quan',

    items: [

      { href: '/dashboard/manager', label: 'Dashboard', icon: '🏠', exact: true },

      { href: '/dashboard/manager/orders', label: 'Đơn hàng ca', icon: '🧾' },
      { href: '/dashboard/manager/shifts', label: 'Quản lý ca NV', icon: '⏱️' },
      { href: '/dashboard/manager/reports', label: 'Báo cáo doanh thu', icon: '📊' },

    ],

  },

  {

    label: 'Vận hành ca (QL cửa hàng)',

    items: [

      { href: '/dashboard/manager/issue', label: 'Cấp phát đầu ca', icon: '📤' },

      { href: '/dashboard/manager/returns', label: 'Thu hồi về kho tổng', icon: '📥' },

      { href: '/dashboard/manager/requests', label: 'Danh sách phiếu', icon: '📋' },

    ],

  },

  {

    label: 'Kho',

    items: [

      { href: '/dashboard/manager/replenish', label: 'Bổ sung tồn', icon: '🔄' },

      { href: '/dashboard/manager/stock', label: 'Tồn kho', icon: '📦' },

    ],

  },

];



export function ManagerLayout({ children }: { children: ReactNode }) {

  return (

    <AppShellLayout

      allowedRoles={[Role.STORE_MANAGER, Role.ADMIN]}

      roleBadge="Quản lý cửa hàng"

      navSections={NAV_SECTIONS}

    >

      {children}

    </AppShellLayout>

  );

}


