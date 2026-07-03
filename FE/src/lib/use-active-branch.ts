'use client';

import { useCallback, useEffect, useState } from 'react';
import { getStoredPlan, getStoredTenant } from '@/lib/auth-storage';
import { getActiveBranch, setActiveBranch, type StoredBranch } from '@/lib/branch-storage';
import { invalidateCache } from '@/lib/api-cache';
import { isChainOperatingPlan } from '@/lib/workspace-routes';
import { SubscriptionPlan, TenantInfo } from '@/models/tenant.model';

export const BRANCH_CHANGE_EVENT = 'bobapos:branch-change';

export function useActiveBranch() {
  const tenant = getStoredTenant<TenantInfo>();
  const plan = getStoredPlan() ?? SubscriptionPlan.STANDARD;
  const isChain = isChainOperatingPlan(tenant, plan ?? undefined);

  const [branch, setBranch] = useState<StoredBranch | null>(() =>
    isChain ? getActiveBranch() : null,
  );
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!isChain) {
      setBranch(null);
      return;
    }
    setBranch(getActiveBranch());
  }, [isChain, tenant?.id]);

  useEffect(() => {
    if (!isChain) return;

    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<StoredBranch>).detail;
      setBranch(detail);
      setVersion((v) => v + 1);
    };

    window.addEventListener(BRANCH_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(BRANCH_CHANGE_EVENT, onChange);
  }, [isChain]);

  const branchId = isChain ? branch?.id : undefined;

  return { branch, branchId, isChain, version };
}

export function publishBranchChange(branch: StoredBranch) {
  setActiveBranch(branch);
  invalidateCache('GET:');
  window.dispatchEvent(new CustomEvent(BRANCH_CHANGE_EVENT, { detail: branch }));
}

export function useBranchScopeLabel(): string | null {
  const { branch, isChain } = useActiveBranch();
  if (!isChain || !branch) return null;
  return `${branch.code} — ${branch.name}`;
}
