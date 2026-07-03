'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { AuthController } from '@/controllers/auth.controller';
import { BRAND } from '@/lib/brand';
import { getStoredUser } from '@/lib/auth-storage';
import { ADMIN_PATH } from '@/lib/workspace-routes';
import { Role, User } from '@/models/user.model';
import { DashboardTopBar, PageLoading } from '@/views/components/app-ui';
import { TrialBanner } from '@/views/subscription/TrialBanner';
import { ExpiredOverlay } from '@/views/subscription/ExpiredOverlay';
import { FeatureGate } from '@/views/subscription/FeatureGate';
import { SessionSync } from '@/views/subscription/SessionSync';

type QuickLink = { href: string; label: string; icon?: string };

export function PosShellLayout({
  children,
  title,
  subtitle,
  quickLinks = [],
  settingsHref,
  hubHref,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  quickLinks?: QuickLink[];
  settingsHref?: string;
  hubHref?: string;
}) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = getStoredUser<User>();
    if (!stored || (stored.role !== Role.ADMIN && stored.role !== Role.STAFF)) {
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

  const isOwner = user.role === Role.ADMIN;

  return (
    <div className={`flex min-h-screen flex-col ${BRAND.pageBg}`}>
      <SessionSync />
      <TrialBanner />
      <DashboardTopBar
        maxWidth="max-w-[100rem]"
        eyebrow={subtitle ?? 'BOBAPOS · Thu ngân'}
        title={title}
        userName={user.fullName}
        onLogout={logout}
        actions={
          <>
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className={BRAND.btnGhost}>
                {link.icon ? `${link.icon} ` : ''}
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            ))}
            {hubHref && (
              <Link href={hubHref} className={BRAND.btnGhost} title="Trang chủ">
                🏠 <span className="hidden sm:inline">Hub</span>
              </Link>
            )}
            {isOwner && (
              <Link
                href={settingsHref ?? ADMIN_PATH}
                className={BRAND.btnGhost}
                title="Cài đặt cửa hàng"
              >
                ⚙️ <span className="hidden sm:inline">Cài đặt</span>
              </Link>
            )}
          </>
        }
      />
      <div className="relative min-h-0 flex-1">
        <FeatureGate>{children}</FeatureGate>
        <ExpiredOverlay />
      </div>
    </div>
  );
}
