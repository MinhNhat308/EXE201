'use client';

import { useEffect } from 'react';
import { syncSessionFromServer } from '@/lib/sync-session';

/** Một lần sync session mỗi layout — tránh TrialBanner + ExpiredOverlay gọi trùng */
export function SessionSync() {
  useEffect(() => {
    void syncSessionFromServer();
  }, []);
  return null;
}
