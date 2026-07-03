import { getStoredTenant } from '@/lib/auth-storage';

const KEY_PREFIX = 'bobapos_active_branch';

export interface StoredBranch {
  id: string;
  code: string;
  name: string;
}

function storageKey(): string {
  const tenant = getStoredTenant<{ id?: string }>();
  return `${KEY_PREFIX}:${tenant?.id ?? 'unknown'}`;
}

export function getActiveBranch(): StoredBranch | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(storageKey());
    return raw ? (JSON.parse(raw) as StoredBranch) : null;
  } catch {
    return null;
  }
}

export function setActiveBranch(branch: StoredBranch | null) {
  if (typeof window === 'undefined') return;
  const key = storageKey();
  if (!branch) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(branch));
}

export function clearActiveBranch() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(storageKey());
}

export function clearAllBranchSelections() {
  if (typeof window === 'undefined') return;
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const k = localStorage.key(i);
    if (k?.startsWith(KEY_PREFIX)) localStorage.removeItem(k);
  }
}
