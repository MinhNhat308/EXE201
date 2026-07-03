'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { AuthController } from '@/controllers/auth.controller';
import { BRAND, BRAND_LOGO } from '@/lib/brand';
import { filterNavByPlan, OWNER_NAV_SECTIONS } from '@/lib/dashboard-nav';
import { hydrateAuthFromServer } from '@/lib/auth-hydrate';
import {
  getStoredPlan,
  getStoredSubscription,
  getStoredUser,
  getSubscriptionStatus,
  getStoredTenant,
} from '@/lib/auth-storage';
import { SaasFeature } from '@/models/saas-feature.model';
import { FeatureGate } from '@/views/subscription/FeatureGate';
import { Role, User } from '@/models/user.model';
import { BranchSwitcher } from '@/views/components/BranchSwitcher';
import { BranchScopeBanner } from '@/views/components/BranchScopeBanner';
import { PageLoading } from '@/views/components/app-ui';
import { isChainOperatingPlan } from '@/lib/workspace-routes';
import { TenantInfo } from '@/models/tenant.model';
import { ExpiredOverlay } from '@/views/subscription/ExpiredOverlay';
import { TrialBanner } from '@/views/subscription/TrialBanner';

export type NavItem = {
  href: string;
  label: string;
  icon?: string;
  exact?: boolean;
  feature?: SaasFeature;
};

export type NavSection = { label: string; items: NavItem[] };

export function AppShellLayout({
  children,
  allowedRole,
  allowedRoles,
  roleBadge,
  navItems,
  navSections,
  ownerNavSections = OWNER_NAV_SECTIONS,
  mainClassName = 'min-w-0 flex-1 overflow-auto p-4 sm:p-6 lg:p-8',
}: {
  children: ReactNode;
  allowedRole?: Role;
  allowedRoles?: Role[];
  roleBadge: string;
  navItems?: NavItem[];
  navSections?: NavSection[];
  ownerNavSections?: NavSection[];
  mainClassName?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const permitted = useMemo(() => {
    const roles = allowedRoles ?? (allowedRole ? [allowedRole] : []);
    if (!roles.includes(Role.ADMIN)) {
      return [...roles, Role.ADMIN];
    }
    return roles;
  }, [allowedRole, allowedRoles]);

  const roleSections: NavSection[] =
    navSections ?? (navItems ? [{ label: 'Menu', items: navItems }] : []);

  const permittedRolesKey = permitted.join('|');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let stored = getStoredUser<User>();
      if (!stored) {
        stored = await hydrateAuthFromServer();
      }
      if (cancelled) return;
      if (!stored || !permitted.includes(stored.role)) {
        router.replace('/login');
        return;
      }
      setUser((prev) => {
        if (prev && prev.email === stored!.email) return prev;
        return stored!;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [router, permitted, permittedRolesKey]);

  const logout = () => {
    AuthController.logout();
    router.replace('/login');
  };

  if (!user) return <PageLoading />;

  const isOwner = user.role === Role.ADMIN;
  const sub = getStoredSubscription<{ plan?: string }>();
  const plan = getStoredPlan() ?? sub?.plan ?? 'STANDARD';
  const subStatus = getSubscriptionStatus() ?? 'ACTIVE';
  const tenant = getStoredTenant<TenantInfo>();
  const isChain = isChainOperatingPlan(tenant, plan);
  const sections = isOwner
    ? filterNavByPlan(ownerNavSections, plan, subStatus)
    : roleSections;
  const badge = isOwner ? (isChain ? 'Chủ chuỗi' : 'Chủ cửa hàng') : roleBadge;

  return (
    <div className={`flex min-h-screen ${BRAND.pageBg}`}>
      <aside
        className={`relative flex w-[17.5rem] shrink-0 flex-col border-r border-white/10 text-white shadow-[4px_0_24px_rgba(15,23,42,0.15)] ${BRAND.sidebarBg}`}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <div className="flex items-center gap-3">
            <Image
              src={BRAND_LOGO}
              alt="BOBAPOS"
              width={40}
              height={40}
              className="rounded-xl object-cover ring-1 ring-white/20"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">BOBAPOS</p>
              <p className="truncate text-[10px] font-medium uppercase tracking-wider text-white/50">
                {badge}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-thin">
          {sections.map((section) => (
            <div key={section.label} className="mb-3">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/35">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`relative flex items-center rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 ${
                        active ? BRAND.navActive : BRAND.navIdle
                      }`}
                    >
                      {active && (
                        <span
                          className={`absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full ${BRAND.navIndicator}`}
                        />
                      )}
                      <span className={active ? 'pl-2' : ''}>
                        {item.icon ? `${item.icon} ` : ''}
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <div className="rounded-xl bg-white/[0.06] px-3 py-2.5 ring-1 ring-white/10">
            <p className="truncate text-sm font-medium">{user.fullName}</p>
            <p className="truncate text-xs text-white/50">{user.email}</p>
            {isOwner && isChain && (
              <div className="mt-2 border-t border-white/10 pt-2">
                <BranchSwitcher />
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={logout}
            className="mt-2 w-full rounded-xl border border-white/15 py-2.5 text-sm text-white/80 transition hover:bg-white/10"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TrialBanner />
        {isOwner && isChain && <BranchScopeBanner />}
        <div className="relative min-w-0 flex-1">
          <main className={mainClassName}>
            <FeatureGate>{children}</FeatureGate>
          </main>
          <ExpiredOverlay />
        </div>
      </div>
    </div>
  );
}
