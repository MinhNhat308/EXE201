'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { AuthController } from '@/controllers/auth.controller';
import { BRAND } from '@/lib/brand';
import { ROLE_LABELS, Role, User } from '@/models/user.model';

interface DashboardLayoutProps {
  user: User;
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function DashboardLayout({
  user,
  title,
  description,
  children,
  actions,
}: DashboardLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    AuthController.logout();
    router.replace('/login');
  };

  return (
    <div className={`min-h-screen ${BRAND.pageBg}`}>
      <header className={BRAND.topBar}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <p className={`text-sm font-semibold ${BRAND.primaryText}`}>BOBAPOS</p>
            <h1 className="text-xl font-bold text-stone-900">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-stone-800">{user.fullName}</p>
              <p className="text-xs text-stone-500">{ROLE_LABELS[user.role as Role]}</p>
            </div>
            <button type="button" onClick={handleLogout} className={BRAND.btnSecondary}>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-stone-900">{title}</h2>
            <p className="mt-1 text-stone-600">{description}</p>
          </div>
          {actions}
        </div>
        {children}
      </main>
    </div>
  );
}
