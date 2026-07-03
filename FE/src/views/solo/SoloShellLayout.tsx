'use client';

import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { AuthController } from '@/controllers/auth.controller';
import { getStoredUser } from '@/lib/auth-storage';
import { BRAND } from '@/lib/brand';
import { Role, User } from '@/models/user.model';
import { DashboardTopBar, PageLoading } from '@/views/components/app-ui';
import { TrialBanner } from '@/views/subscription/TrialBanner';
import { ExpiredOverlay } from '@/views/subscription/ExpiredOverlay';
import { FeatureGate } from '@/views/subscription/FeatureGate';

export function SoloShellLayout({
  children,
  title,
  backHref,
}: {
  children: ReactNode;
  title?: string;
  backHref?: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored || stored.role !== Role.ADMIN) {
      router.replace('/login');
      return;
    }
    setUser(stored);
  }, [router]);

  const logout = () => {
    AuthController.logout();
    router.replace('/login');
  };

  if (!user) return <PageLoading />;

  return (
    <div className={`flex min-h-screen flex-col ${BRAND.pageBg}`}>
      <TrialBanner />
      <DashboardTopBar
        eyebrow="BOBAPOS Solo"
        title={title}
        userName={user.fullName}
        backHref={backHref}
        onLogout={logout}
      />
      <div className="relative flex-1">
        <FeatureGate>{children}</FeatureGate>
        <ExpiredOverlay />
      </div>
    </div>
  );
}
