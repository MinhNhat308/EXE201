import { clearAllBranchSelections } from '@/lib/branch-storage';

const TOKEN_KEY = 'auth_token';

const USER_KEY = 'auth_user';

const TENANT_KEY = 'auth_tenant';

const SUBSCRIPTION_KEY = 'auth_subscription';

const TRIAL_DAYS_KEY = 'auth_trial_days';

const PLAN_KEY = 'auth_plan';

const STATUS_KEY = 'auth_status';



export function saveAuth(

  token: string,

  user: object,

  extras?: {

    tenant?: object;

    subscription?: object;

    trialDaysLeft?: number;

    plan?: string;

    status?: string;

  },

) {

  if (typeof window === 'undefined') return;

  localStorage.setItem(TOKEN_KEY, token);

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  if (extras?.tenant) {

    localStorage.setItem(TENANT_KEY, JSON.stringify(extras.tenant));

  }

  if (extras?.subscription) {

    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(extras.subscription));

  }

  if (extras?.trialDaysLeft != null) {

    localStorage.setItem(TRIAL_DAYS_KEY, String(extras.trialDaysLeft));

  }

  if (extras?.plan) localStorage.setItem(PLAN_KEY, extras.plan);

  if (extras?.status) localStorage.setItem(STATUS_KEY, extras.status);

  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  document.cookie = `auth_token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax${secure}`;


}



function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const fromStorage = localStorage.getItem(TOKEN_KEY);
  if (fromStorage) return fromStorage;
  const fromCookie = readCookie('auth_token');
  if (fromCookie) {
    localStorage.setItem(TOKEN_KEY, fromCookie);
    return fromCookie;
  }
  return null;
}



export function getStoredUser<T>(): T | null {

  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(USER_KEY);

  if (!raw) return null;

  try {

    return JSON.parse(raw) as T;

  } catch {

    return null;

  }

}



export function getStoredTenant<T>(): T | null {

  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(TENANT_KEY);

  if (!raw) return null;

  try {

    return JSON.parse(raw) as T;

  } catch {

    return null;

  }

}



export function updateStoredTenant(patch: object) {

  if (typeof window === 'undefined') return;

  const current = getStoredTenant<Record<string, unknown>>();

  if (!current) return;

  localStorage.setItem(TENANT_KEY, JSON.stringify({ ...current, ...patch }));

}



export function getStoredSubscription<T>(): T | null {

  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(SUBSCRIPTION_KEY);

  if (!raw) return null;

  try {

    return JSON.parse(raw) as T;

  } catch {

    return null;

  }

}



export function getTrialDaysLeft(): number {

  if (typeof window === 'undefined') return 0;

  return parseInt(localStorage.getItem(TRIAL_DAYS_KEY) ?? '0', 10) || 0;

}



export function getSubscriptionStatus(): string | null {

  if (typeof window === 'undefined') return null;

  return localStorage.getItem(STATUS_KEY);

}



export function getStoredPlan(): string | null {

  if (typeof window === 'undefined') return null;

  return localStorage.getItem(PLAN_KEY);

}



export function isSubscriptionExpired(): boolean {

  return getSubscriptionStatus() === 'EXPIRED' || getSubscriptionStatus() === 'SUSPENDED';

}



export function clearAuth() {

  if (typeof window === 'undefined') return;

  localStorage.removeItem(TOKEN_KEY);

  localStorage.removeItem(USER_KEY);

  localStorage.removeItem(TENANT_KEY);

  localStorage.removeItem(SUBSCRIPTION_KEY);

  localStorage.removeItem(TRIAL_DAYS_KEY);

  localStorage.removeItem(PLAN_KEY);

  localStorage.removeItem(STATUS_KEY);

  clearAllBranchSelections();

  document.cookie = 'auth_token=; path=/; max-age=0';

}


