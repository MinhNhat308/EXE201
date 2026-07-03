import { apiRequest } from '@/lib/api';
import { clearAuth, getStoredUser, getToken, saveAuth } from '@/lib/auth-storage';
import type { User } from '@/models/user.model';

let inflight: Promise<User | null> | null = null;

/** Khôi phục user/tenant khi có cookie token nhưng thiếu localStorage (tránh loop /login ↔ /dashboard). */
export function hydrateAuthFromServer(): Promise<User | null> {
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const token = getToken();
      if (!token) return null;

      const existing = getStoredUser<User>();
      if (existing) return existing;

      const [user, session] = await Promise.all([
        apiRequest<User>('/users/me', { auth: true }),
        apiRequest<{
          tenant: object;
          subscription: object;
          trialDaysLeft: number;
          plan: string;
          status: string;
        }>('/auth/session', { auth: true, skipCache: true }),
      ]);

      saveAuth(token, user, {
        tenant: session.tenant,
        subscription: session.subscription,
        trialDaysLeft: session.trialDaysLeft,
        plan: session.plan,
        status: session.status,
      });
      return user;
    } catch {
      clearAuth();
      return null;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}
