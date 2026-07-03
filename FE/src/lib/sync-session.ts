import { AuthController } from '@/controllers/auth.controller';
import { getToken, getStoredUser, saveAuth } from '@/lib/auth-storage';
import { invalidateCache } from '@/lib/api-cache';

const SESSION_TTL_MS = 60_000;
let lastSyncAt = 0;
let inflight: Promise<boolean> | null = null;

/** Đồng bộ trial/subscription từ BE — dedupe + cache 60s */
export async function syncSessionFromServer(force = false): Promise<boolean> {
  if (!getToken()) return false;
  const user = getStoredUser();
  if (!user) return false;

  const now = Date.now();
  if (force) {
    invalidateCache('GET:/auth/session');
    lastSyncAt = 0;
  } else if (now - lastSyncAt < SESSION_TTL_MS) {
    return true;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const session = await AuthController.getSession();
      saveAuth(getToken()!, user, {
        tenant: session.tenant,
        subscription: session.subscription,
        trialDaysLeft: session.trialDaysLeft,
        plan: session.plan,
        status: session.status,
      });
      lastSyncAt = Date.now();
      return true;
    } catch {
      return false;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
