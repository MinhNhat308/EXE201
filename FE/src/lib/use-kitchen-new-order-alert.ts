'use client';

import { useEffect, useRef, useState } from 'react';

function playKitchenChime() {
  if (typeof window === 'undefined') return;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const beep = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.value = 0.12;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    beep(880, ctx.currentTime, 0.18);
    beep(1175, ctx.currentTime + 0.22, 0.22);
    window.setTimeout(() => void ctx.close(), 800);
  } catch {
    /* ignore — autoplay policy */
  }
}

export function useKitchenNewOrderAlert(pendingCount: number, enabled: boolean) {
  const prev = useRef<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    if (prev.current === null) {
      prev.current = pendingCount;
      return;
    }

    if (pendingCount > prev.current) {
      const diff = pendingCount - prev.current;
      playKitchenChime();
      setToast(
        diff === 1
          ? '🆕 Có 1 đơn mới cần làm!'
          : `🆕 Có ${diff} đơn mới cần làm!`,
      );
      const id = window.setTimeout(() => setToast(null), 6_000);
      prev.current = pendingCount;
      return () => window.clearTimeout(id);
    }

    prev.current = pendingCount;
  }, [pendingCount, enabled]);

  return {
    toast,
    dismissToast: () => setToast(null),
  };
}
