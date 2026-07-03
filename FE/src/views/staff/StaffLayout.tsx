'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { getStoredUser } from '@/lib/auth-storage';
import { isStoreOwner } from '@/lib/role-access';
import {
  STORE_CASHIER_ORDERS_PATH,
  STORE_CASHIER_POS_PATH,
  STORE_CHECK_IN_PATH,
  STORE_STAFF_HUB_PATH,
} from '@/lib/workspace-routes';
import { Role, User } from '@/models/user.model';
import { AppShellLayout, type NavItem } from '@/views/components/AppShellLayout';

const OWNER_NAV: NavItem[] = [
  { href: STORE_STAFF_HUB_PATH, label: 'Hub thu ngân', icon: '🏠' },
  { href: STORE_CASHIER_POS_PATH, label: 'POS', icon: '💳' },
  { href: '/dashboard/staff/server', label: 'Phục vụ', icon: '🍽️' },
  { href: STORE_CASHIER_ORDERS_PATH, label: 'Đơn hôm nay', icon: '📋' },
  { href: STORE_CHECK_IN_PATH, label: 'Check-in ca', icon: '⏱️' },
];

const CASHIER_NAV: NavItem[] = [
  { href: STORE_CASHIER_POS_PATH, label: 'Bán hàng', icon: '🛒' },
  { href: '/dashboard/staff/server', label: 'Phục vụ', icon: '🍽️' },
  { href: STORE_CASHIER_ORDERS_PATH, label: 'Hóa đơn hôm nay', icon: '📋' },
  { href: STORE_CHECK_IN_PATH, label: 'Check-in ca', icon: '⏱️' },
];

export function StaffLayout({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser<User>());
  }, []);

  const navItems = useMemo(
    () => (user && isStoreOwner(user.role) ? OWNER_NAV : CASHIER_NAV),
    [user],
  );

  return (
    <AppShellLayout
      allowedRoles={[Role.STAFF, Role.ADMIN]}
      roleBadge="Bán hàng"
      navItems={navItems}
      mainClassName={
        compact
          ? 'min-w-0 flex-1 overflow-auto p-0'
          : 'min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8'
      }
    >
      {children}
    </AppShellLayout>
  );
}
