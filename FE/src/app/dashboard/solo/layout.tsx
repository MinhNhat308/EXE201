import type { ReactNode } from 'react';
import { SessionSync } from '@/views/subscription/SessionSync';

/** Session sync một lần cho mọi trang Solo — không remount khi chuyển Hub/POS/Sales/Settings */
export default function SoloDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SessionSync />
      {children}
    </>
  );
}
