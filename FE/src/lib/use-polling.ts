'use client';

import { useEffect, useRef } from 'react';

/** Poll chỉ khi tab đang hiển thị — giảm tải API */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
) {
  const saved = useRef(callback);

  useEffect(() => {
    saved.current = callback;
  });

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const tick = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      void saved.current();
    };

    tick();
    const id = setInterval(tick, intervalMs);
    const onVis = () => {
      if (!document.hidden) tick();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [intervalMs, enabled]);
}
