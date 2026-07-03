'use client';

import { useEffect, useState } from 'react';
import { BranchesController } from '@/controllers/branches.controller';
import { getStoredPlan } from '@/lib/auth-storage';
import { getActiveBranch, type StoredBranch } from '@/lib/branch-storage';
import { planHasFeature } from '@/lib/plan-features';
import { publishBranchChange } from '@/lib/use-active-branch';
import { SaasFeature } from '@/models/saas-feature.model';
import { SubscriptionPlan } from '@/models/tenant.model';
import type { Branch } from '@/models/branch.model';

export function BranchSwitcher({ onChange }: { onChange?: (branch: StoredBranch | null) => void }) {
  const plan = getStoredPlan() ?? SubscriptionPlan.PREMIUM;
  const enabled = planHasFeature(plan, 'ACTIVE', SaasFeature.MULTI_BRANCH);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [active, setActive] = useState<StoredBranch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    BranchesController.list(true)
      .then((rows) => {
        setBranches(rows);
        const stored = getActiveBranch();
        const pick =
          stored && rows.some((b) => b.id === stored.id)
            ? stored
            : rows.find((b) => b.isDefault) ?? rows[0];
        if (pick) {
          const s = { id: pick.id, code: pick.code, name: pick.name };
          setActive(s);
          onChange?.(s);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [enabled, onChange]);

  if (!enabled || loading || branches.length < 2) return null;

  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-white/50">
        Chi nhánh đang xem
      </span>
      <select
        value={active?.id ?? ''}
        onChange={(e) => {
          const b = branches.find((x) => x.id === e.target.value);
          if (!b) return;
          const s = { id: b.id, code: b.code, name: b.name };
          setActive(s);
          onChange?.(s);
          publishBranchChange(s);
        }}
        className="w-full truncate rounded-lg border border-white/20 bg-white/95 px-2 py-2 text-xs font-semibold text-slate-900 shadow-sm"
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.code} — {b.name}
          </option>
        ))}
      </select>
    </label>
  );
}
