'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BRAND } from '@/lib/brand';
import {
  getStoredTenant,
  getStoredUser,
  getSubscriptionStatus,
  isSubscriptionExpired,
} from '@/lib/auth-storage';
import { getBillingPath } from '@/lib/workspace-routes';
import { TenantInfo } from '@/models/tenant.model';
import { Role } from '@/models/user.model';

export function ExpiredOverlay() {
  const [expired, setExpired] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [billingPath, setBillingPath] = useState('/dashboard/admin/billing');

  useEffect(() => {
    const applyLocal = () => {
      setExpired(isSubscriptionExpired());
      const user = getStoredUser<{ role: Role }>();
      setIsAdmin(user?.role === Role.ADMIN);
      setBillingPath(getBillingPath(getStoredTenant<TenantInfo>()));
    };
    applyLocal();
    const id = window.setInterval(applyLocal, 30_000);
    return () => window.clearInterval(id);
  }, []);

  if (!expired) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-end justify-center bg-stone-900/5 p-6">
      <div className="pointer-events-auto max-w-lg rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl">
        <p className="text-lg font-bold text-stone-900">Gói BOBAPOS đã hết hạn</p>
        <p className="mt-2 text-sm text-stone-600">
          Bạn vẫn xem được dữ liệu nhưng không thể tạo đơn, phiếu kho hay chỉnh sửa mới.
          {isAdmin
            ? ' Gia hạn gói để tiếp tục vận hành.'
            : ' Liên hệ chủ cửa hàng để gia hạn gói.'}
        </p>
        {isAdmin && (
          <Link
            href={billingPath}
            className={`mt-4 inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${BRAND.primary}`}
          >
            Thanh toán & gia hạn
          </Link>
        )}
        <p className="mt-3 text-xs text-stone-400">
          Trạng thái: {getSubscriptionStatus() ?? 'EXPIRED'}
        </p>
      </div>
    </div>
  );
}
