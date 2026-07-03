'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShiftController } from '@/controllers/shift.controller';
import { BRAND } from '@/lib/brand';
import { PageLoading } from '@/views/components/app-ui';
import { hydrateAuthFromServer } from '@/lib/auth-hydrate';
import { getStoredUser } from '@/lib/auth-storage';
import { staffSessionFromRecord } from '@/lib/shift-session-map';
import {
  saveStaffSession,
  syncStaffSessionFromServer,
} from '@/lib/staff-session-storage';
import {
  getPrimaryWorkspacePath,
  getWorkPathAfterCheckIn,
  needsShiftCheckIn,
} from '@/lib/workspace-routes';
import {
  WORK_ROLE_LABELS,
  WORK_SHIFT_HOURS,
  WORK_SHIFT_LABELS,
  WorkRole,
  WorkShift,
} from '@/models/staff.model';
import { Role, User } from '@/models/user.model';

type Step = 'shift' | 'role';

export function ShiftCheckInView() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<Step>('shift');
  const [selectedShift, setSelectedShift] = useState<WorkShift | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      let stored = getStoredUser<User>();
      if (!stored) {
        stored = await hydrateAuthFromServer();
      }
      if (cancelled) return;
      if (!stored) {
        router.replace('/login');
        return;
      }

      if (!needsShiftCheckIn(stored.role)) {
        router.replace(getPrimaryWorkspacePath(stored.role));
        return;
      }

      setUser(stored);

      const existing = await syncStaffSessionFromServer();
      if (cancelled) return;

      if (existing && existing.checkedInRole === stored.role) {
        router.replace(getWorkPathAfterCheckIn(stored.role, existing.workRole));
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const finishCheckIn = async (shift: WorkShift, workRole?: WorkRole) => {
    if (!user || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      const record = await ShiftController.checkIn({
        workShift: shift,
        workRole,
        branchId: user.branchId,
      });
      saveStaffSession(staffSessionFromRecord(record));
      router.replace(getWorkPathAfterCheckIn(user.role, workRole));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in thất bại');
      setSubmitting(false);
    }
  };

  const handleSelectShift = (shift: WorkShift) => {
    if (!user || submitting) return;

    if (user.role === Role.KITCHEN) {
      void finishCheckIn(shift);
      return;
    }

    setSelectedShift(shift);
    setStep('role');
  };

  const handleSelectRole = (role: WorkRole) => {
    if (!selectedShift) return;
    void finishCheckIn(selectedShift, role);
  };

  if (!user) return <PageLoading />;

  const isKitchen = user.role === Role.KITCHEN;

  return (
    <div className={`min-h-screen ${BRAND.pageBg} px-4 py-8 sm:px-6`}>
      <div className="mx-auto max-w-2xl">
        <div
          className={`mb-8 rounded-2xl bg-gradient-to-r ${BRAND.headerGradient} p-6 text-white shadow-lg`}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
            Check-in ca
          </p>
          <h1 className="mt-1 text-2xl font-bold">Xin chào, {user.fullName}</h1>
          <p className="mt-2 text-sm text-white/85">
            {step === 'shift' || isKitchen
              ? 'Chọn ca làm việc hôm nay'
              : 'Chọn vai trò làm việc trong ca'}
          </p>
        </div>

        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
        )}

        {step === 'shift' || isKitchen ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Object.values(WorkShift).map((shift) => (
              <button
                key={shift}
                type="button"
                disabled={submitting}
                onClick={() => handleSelectShift(shift)}
                className={`rounded-xl border-2 bg-white p-5 text-left transition hover:shadow-md disabled:opacity-60 ${BRAND.primarySoft}`}
              >
                <p className="text-lg font-semibold text-stone-800">
                  {WORK_SHIFT_LABELS[shift]}
                </p>
                <p className="mt-1 text-sm text-stone-500">{WORK_SHIFT_HOURS[shift]}</p>
              </button>
            ))}
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setStep('shift')}
              className={`mb-4 text-sm ${BRAND.primaryText} hover:underline disabled:opacity-60`}
            >
              ← Đổi ca ({selectedShift && WORK_SHIFT_LABELS[selectedShift]})
            </button>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSelectRole(WorkRole.CASHIER)}
                className={`rounded-xl border-2 bg-white p-6 text-left transition hover:shadow-md disabled:opacity-60 ${BRAND.primarySoft}`}
              >
                <p className="text-3xl">💰</p>
                <p className="mt-3 text-lg font-semibold text-stone-800">
                  {WORK_ROLE_LABELS[WorkRole.CASHIER]}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Tạo đơn, thanh toán và in hóa đơn
                </p>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSelectRole(WorkRole.SERVER)}
                className="rounded-xl border-2 border-emerald-100 bg-emerald-50/80 p-6 text-left transition hover:border-emerald-300 hover:shadow-md disabled:opacity-60"
              >
                <p className="text-3xl">🍹</p>
                <p className="mt-3 text-lg font-semibold text-stone-800">
                  {WORK_ROLE_LABELS[WorkRole.SERVER]}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  Giao món READY cho khách
                </p>
              </button>
            </div>
          </>
        )}

        {submitting && (
          <p className="mt-6 text-center text-sm text-stone-500">Đang ghi nhận ca...</p>
        )}
      </div>
    </div>
  );
}
