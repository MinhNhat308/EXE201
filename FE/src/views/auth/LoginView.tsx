'use client';

import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthController } from '@/controllers/auth.controller';
import { hydrateAuthFromServer } from '@/lib/auth-hydrate';
import { getStoredTenant, getStoredUser, getToken } from '@/lib/auth-storage';
import { BRAND } from '@/lib/brand';
import { getPostLoginPath } from '@/lib/onboarding';
import type { TenantInfo } from '@/models/tenant.model';
import { Role, User } from '@/models/user.model';
import { AuthMarketingLayout } from './AuthMarketingLayout';

function needsStoreCode(identifier: string) {
  const id = identifier.trim();
  return id.length > 0 && !id.includes('@');
}

export function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingSession, setExistingSession] = useState<{
    name: string;
    href: string;
  } | null>(null);

  const showStoreCode = useMemo(() => needsStoreCode(identifier), [identifier]);

  useEffect(() => {
    if (searchParams.get('registered') === '1') {
      const email = searchParams.get('email');
      if (email) setIdentifier(email);
      setSuccess('Đăng ký thành công! Mời đăng nhập để bắt đầu.');
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let user = getStoredUser<User>();
      if (!user && getToken()) {
        user = await hydrateAuthFromServer();
      }
      if (cancelled || !user?.role) return;

      const tenant = getStoredTenant<TenantInfo>();
      setExistingSession({
        name: user.fullName,
        href: getPostLoginPath(user.role as Role, tenant ?? undefined),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const id = identifier.trim();
    const slug = storeSlug.trim();
    if (needsStoreCode(id) && !slug) {
      setError('Nhân viên cần nhập mã cửa hàng (chủ quán cung cấp).');
      return;
    }

    setLoading(true);
    try {
      const { user, tenant, plan } = await AuthController.login({
        identifier: id,
        password,
        storeSlug: needsStoreCode(id) ? slug : undefined,
      });
      router.replace(
        getPostLoginPath(user.role as Role, tenant as TenantInfo | undefined, plan),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthMarketingLayout
      title="Đăng nhập cửa hàng của bạn"
      subtitle="Chủ quán dùng email. Nhân viên dùng tên đăng nhập kèm mã cửa hàng do chủ quán cấp."
    >
      <div className="mb-6">
        <span className="inline-flex rounded-full bg-gradient-to-r from-sky-100 via-violet-100 to-rose-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">
          Chào mừng trở lại
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-stone-900">Đăng nhập</h2>
        <p className="mt-1 text-sm text-stone-500">
          Email (chủ quán) hoặc username (nhân viên)
        </p>
      </div>

      {existingSession && (
        <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <p>
            Bạn đang đăng nhập là <strong>{existingSession.name}</strong>.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={existingSession.href}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold text-white ${BRAND.primary}`}
            >
              Tiếp tục vào ứng dụng
            </Link>
            <button
              type="button"
              onClick={() => {
                AuthController.logout();
                setExistingSession(null);
              }}
              className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {success && (
        <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-stone-700">
            Email hoặc tên đăng nhập
          </label>
          <input
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            className={BRAND.input}
            placeholder="email@congty.com hoặc ten_dang_nhap"
          />
        </div>

        {showStoreCode && (
          <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
            <label className="mb-1.5 block text-sm font-semibold text-stone-700">
              Mã cửa hàng
            </label>
            <input
              type="text"
              value={storeSlug}
              onChange={(e) => setStoreSlug(e.target.value)}
              required
              className={BRAND.input}
              placeholder="ma-cua-hang"
            />
            <p className="mt-2 text-xs text-violet-600">
              Mã do chủ quán cung cấp khi tạo tài khoản nhân viên
            </p>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-stone-700">Mật khẩu</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className={BRAND.input}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-gradient-to-r from-[#2F80ED] via-[#8B5CF6] to-[#FF8E53] py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-300/40 transition hover:shadow-xl disabled:opacity-60"
        >
          {loading ? 'Đang đăng nhập...' : 'Đăng nhập →'}
        </button>

        <p className="pt-2 text-center text-sm text-stone-500">
          Chưa có cửa hàng?{' '}
          <Link href="/register" className={`font-semibold ${BRAND.primaryText}`}>
            Đăng ký trial 7 ngày
          </Link>
        </p>
      </form>
    </AuthMarketingLayout>
  );
}
