'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useState } from 'react';
import { BrandLogo } from '@/components/BrandLogo';
import { getStoredTenant, getStoredUser, getToken } from '@/lib/auth-storage';
import { hydrateAuthFromServer } from '@/lib/auth-hydrate';
import { BRAND, MARKETING } from '@/lib/brand';
import { getPrimaryWorkspacePath } from '@/lib/workspace-routes';
import { TenantInfo } from '@/models/tenant.model';
import { Role, User } from '@/models/user.model';

export function MarketingShell({
  children,
  active,
}: {
  children: ReactNode;
  active?: 'home' | 'pricing' | 'login' | 'register';
}) {
  const [dashboardHref, setDashboardHref] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let user = getStoredUser<User>();
      if (!user && getToken()) {
        user = await hydrateAuthFromServer();
      }
      if (cancelled || !user?.role) return;

      const tenant = getStoredTenant<TenantInfo>();
      setDashboardHref(
        getPrimaryWorkspacePath(user.role as Role, tenant ?? undefined),
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const navLink = (href: string, key: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium transition ${
        active === key
          ? `${BRAND.primaryText} font-semibold`
          : 'text-stone-600 hover:text-stone-900'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className={`min-h-screen ${MARKETING.pageBg}`}>
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/75 backdrop-blur-xl shadow-sm shadow-violet-100/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <BrandLogo />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLink('/', 'home', 'Trang chủ')}
            {navLink('/pricing', 'pricing', 'Bảng giá')}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className={`hidden rounded-xl px-4 py-2.5 text-sm font-medium sm:inline-block ${
                active === 'login'
                  ? `${BRAND.primaryText} font-semibold`
                  : 'text-stone-700 hover:bg-stone-100'
              }`}
            >
              Đăng nhập
            </Link>
            {dashboardHref ? (
              <Link
                href={dashboardHref}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
              >
                Vào ứng dụng
              </Link>
            ) : null}
            <Link
              href="/register"
              className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#2F80ED]/30 ${BRAND.primary}`}
            >
              Dùng thử 7 ngày
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className={`relative overflow-hidden ${MARKETING.footerGradient} text-white`}>
        <div className="pointer-events-none absolute inset-0 landing-cta-mesh opacity-80" />
        <div className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="inline-flex rounded-2xl bg-white/15 px-3 py-2 backdrop-blur-sm">
              <BrandLogo />
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/85">
              POS, bếp KDS, kho & kế toán trên một nền tảng SaaS — từ quán nhỏ đến chuỗi
              đa chi nhánh.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-xs font-medium text-white backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
              </span>
              Trial Premium 7 ngày · không cần thẻ
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 md:col-span-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                Sản phẩm
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/85">
                <li>
                  <Link href="/pricing" className="transition hover:text-white">
                    Bảng giá Solo · Store · Chain
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="transition hover:text-white">
                    Đăng ký cửa hàng
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="transition hover:text-white">
                    Đăng nhập
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60">
                Tính năng
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/85">
                <li>POS & ca làm việc</li>
                <li>Bếp realtime (KDS)</li>
                <li>Kho & nhập NCC</li>
                <li>Báo cáo đa chi nhánh</li>
              </ul>
            </div>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">
              Bắt đầu ngay
            </p>
            <p className="mt-4 text-sm text-white/85">
              Tạo cửa hàng trong vài phút — menu & kho mẫu sẵn có.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#7C3AED] shadow-lg transition hover:bg-amber-50"
            >
              Tạo cửa hàng miễn phí
            </Link>
          </div>
        </div>
        <div className="relative border-t border-white/20 py-6 text-center text-xs text-white/60">
          © {new Date().getFullYear()} BOBAPOS · EXE201
        </div>
      </footer>
    </div>
  );
}
