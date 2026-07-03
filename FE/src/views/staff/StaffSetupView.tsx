'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { STORE_CHECK_IN_PATH } from '@/lib/workspace-routes';

/** Chuyển hướng setup cũ → check-in thống nhất */
export function StaffSetupView() {
  const router = useRouter();

  useEffect(() => {
    router.replace(STORE_CHECK_IN_PATH);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center text-stone-500">
      Đang chuyển hướng...
    </div>
  );
}
