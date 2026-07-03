'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth-storage';
import { DashboardLayout } from '@/views/components/DashboardLayout';
import { canAccessRole } from '@/lib/role-access';
import { Role, User } from '@/models/user.model';

interface RoleDashboardProps {
  allowedRole: Role;
  title: string;
  description: string;
  features: string[];
  extraActions?: React.ReactNode;
}

export function RoleDashboard({
  allowedRole,
  title,
  description,
  features,
  extraActions,
}: RoleDashboardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored) {
      router.replace('/login');
      return;
    }
    if (!canAccessRole(stored.role, allowedRole)) {
      router.replace('/login');
      return;
    }
    setUser((prev) => {
      if (prev && prev.email === stored.email) return prev;
      return stored;
    });
  }, [allowedRole, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-stone-500">
        Đang tải...
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      title={title}
      description={description}
      actions={extraActions}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature}
            className="rounded-xl border border-amber-100 bg-white p-5 shadow-sm"
          >
            <p className="font-medium text-stone-800">{feature}</p>
            <p className="mt-2 text-sm text-stone-500">Sắp triển khai</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}

export function AdminDashboardView() {
  return null;
}

export function StaffDashboardView() {
  // Redirect handled by StaffHubView at /dashboard/staff
  return null;
}

export function KitchenDashboardView() {
  return (
    <RoleDashboard
      allowedRole={Role.KITCHEN}
      title="Dashboard Bếp"
      description="Theo dõi và chế biến đơn hàng"
      features={[
        'Danh sách đơn chờ',
        'Cập nhật trạng thái món',
        'Ưu tiên đơn gấp',
        'Lịch sử chế biến',
      ]}
    />
  );
}

export function WarehouseDashboardView() {
  return (
    <RoleDashboard
      allowedRole={Role.WAREHOUSE}
      title="Dashboard Kho"
      description="Quản lý nguyên liệu và tồn kho"
      features={[
        'Nhập / xuất kho',
        'Kiểm tra tồn kho',
        'Cảnh báo hết hàng',
        'Báo cáo tồn kho',
      ]}
    />
  );
}

export function AccountingDashboardView() {
  return (
    <RoleDashboard
      allowedRole={Role.ACCOUNTING}
      title="Dashboard Kế toán"
      description="Theo dõi doanh thu, chi phí và báo cáo tài chính"
      features={[
        'Báo cáo doanh thu',
        'Quản lý chi phí',
        'Đối soát thanh toán',
        'Xuất báo cáo',
      ]}
    />
  );
}
