"use client";

import { type FormEvent, useState } from "react";
import { BadgeCheck, Building2, CheckCircle2, ClipboardList, Edit, FileText, Plus, Trash2, Users } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  useCreateSubscriptionPlan,
  useDeleteSubscriptionPlan,
  useSubscriptionPlansOverview,
  useUpdateSubscriptionPlan
} from "@/modules/subscription-plans/api/subscription-plan.queries";
import type { CreateSubscriptionPlanDto, SubscriptionPlanDto } from "@/modules/subscription-plans/types/subscription-plan.types";

const metricIcons = [ClipboardList, Users, Building2, FileText];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    currency: "VND",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(value);
}

function emptyForm(): CreateSubscriptionPlanDto {
  return {
    name: "",
    value: "",
    price: "",
    description: "",
    status: "active",
    features: []
  };
}

function PlanFormDialog({
  plan,
  open,
  onClose
}: {
  plan?: SubscriptionPlanDto;
  open: boolean;
  onClose: () => void;
}) {
  const [values, setValues] = useState<CreateSubscriptionPlanDto>(() =>
    plan
      ? {
          name: plan.name,
          value: plan.value,
          price: plan.price,
          description: plan.description,
          status: plan.status,
          features: plan.features
        }
      : emptyForm()
  );
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan(plan?.id ?? "");
  const isSubmitting = createPlan.isPending || updatePlan.isPending;
  const error = createPlan.error ?? updatePlan.error;

  if (!open) {
    return null;
  }

  function setField<Key extends keyof CreateSubscriptionPlanDto>(key: Key, value: CreateSubscriptionPlanDto[Key]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = {
      ...values,
      value: values.value.trim().toLowerCase().replace(/\s+/g, "_"),
      features: values.features.map((feature) => feature.trim()).filter(Boolean)
    };

    if (plan) {
      updatePlan.mutate(payload, { onSuccess: onClose });
      return;
    }

    createPlan.mutate(payload, { onSuccess: onClose });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4">
      <form className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl dark:bg-slate-950" onSubmit={submit}>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-950 dark:text-white">{plan ? "Chỉnh sửa plan" : "Tạo plan mới"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Plan value là mã dùng để gắn owner/store vào gói, ví dụ starter, premium.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">Tên plan</label>
            <Input value={values.name} onChange={(event) => setField("name", event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">Value</label>
            <Input value={values.value} onChange={(event) => setField("value", event.target.value)} required disabled={Boolean(plan && plan.owners > 0)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">Giá</label>
            <Input value={values.price} onChange={(event) => setField("price", event.target.value)} placeholder="$49 hoặc Custom" required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">Trạng thái</label>
            <Select value={values.status} onChange={(event) => setField("status", event.target.value as CreateSubscriptionPlanDto["status"])}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase text-slate-500">Mô tả</label>
            <Input value={values.description} onChange={(event) => setField("description", event.target.value)} required />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold uppercase text-slate-500">Features, mỗi dòng một item</label>
            <textarea
              className="min-h-28 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring dark:bg-slate-950"
              value={values.features.join("\n")}
              onChange={(event) => setField("features", event.target.value.split("\n"))}
            />
          </div>
        </div>
        {error ? <p className="mt-4 text-sm font-semibold text-destructive">{error.message}</p> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Hủy</Button>
          <Button disabled={isSubmitting}>{plan ? "Lưu thay đổi" : "Tạo plan"}</Button>
        </div>
      </form>
    </div>
  );
}

export default function SubscriptionPlansPage() {
  const overview = useSubscriptionPlansOverview();
  const deletePlan = useDeleteSubscriptionPlan();
  const data = overview.data;
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanDto | undefined>();
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlanDto | undefined>();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Subscription Plans</p>
          <h1 className="text-3xl font-bold text-primary">Quản lý gói dịch vụ</h1>
          <p className="text-muted-foreground">Theo dõi các gói đang dùng bởi owner, cửa hàng và hợp đồng trong hệ thống.</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-white" onClick={() => setCreatingPlan(true)}>
          <Plus className="h-4 w-4" />
          Tạo plan mới
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data?.metrics ?? []).map((metric, index) => {
          const Icon = metricIcons[index] ?? ClipboardList;
          return (
            <Card key={metric.label}>
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-2xl font-bold text-primary">{formatNumber(metric.value)}</p>
                </div>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
              </CardContent>
            </Card>
          );
        })}
        {overview.isLoading ? [0, 1, 2, 3].map((item) => <div key={item} className="h-28 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-900" />) : null}
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        {(data?.plans ?? []).map((plan) => (
          <Card key={plan.value} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{plan.name}</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <StatusBadge status={plan.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <p className="text-3xl font-bold text-primary">{plan.price}</p>
                <p className="text-sm text-muted-foreground">{plan.price === "Custom" ? "Theo hợp đồng" : "per owner/month"}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="font-bold text-primary">{formatNumber(plan.owners)}</p>
                  <p className="text-muted-foreground">Owners</p>
                </div>
                <div>
                  <p className="font-bold text-primary">{formatNumber(plan.stores)}</p>
                  <p className="text-muted-foreground">Stores</p>
                </div>
                <div>
                  <p className="font-bold text-primary">{formatNumber(plan.activeContracts)}</p>
                  <p className="text-muted-foreground">Contracts</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900">
                <div>
                  <p className="font-bold text-primary">{formatNumber(plan.activeContracts)}</p>
                  <p className="text-muted-foreground">Active contracts</p>
                </div>
                <div>
                  <p className="font-bold text-primary">{formatCurrency(plan.contractAmount)}</p>
                  <p className="text-muted-foreground">Contract value</p>
                </div>
              </div>

              <div className="space-y-2">
                {plan.features.map((feature) => (
                  <p key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {feature}
                  </p>
                ))}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Button variant="outline" size="sm" onClick={() => setEditingPlan(plan)}>
                  <Edit className="h-4 w-4" />
                  Sửa
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDeletingPlan(plan)} disabled={plan.owners > 0}>
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Plan mapping</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full table-fixed text-sm">
            <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Plan</th>
                <th className="px-4 py-3 text-left font-semibold">Value</th>
                <th className="px-4 py-3 text-left font-semibold">Active owners</th>
                <th className="px-4 py-3 text-left font-semibold">Active contracts</th>
                <th className="px-4 py-3 text-left font-semibold">Owner status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.plans ?? []).map((plan) => (
                <tr key={plan.value} className="border-t">
                  <td className="px-4 py-4 font-semibold text-primary">{plan.name}</td>
                  <td className="px-4 py-4">{plan.value}</td>
                  <td className="px-4 py-4">{formatNumber(plan.activeOwners)}</td>
                  <td className="px-4 py-4">{formatNumber(plan.activeContracts)}</td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      {plan.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!overview.isLoading && data?.plans.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-muted-foreground" colSpan={5}>
                    No subscription plan data found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {creatingPlan ? <PlanFormDialog open={creatingPlan} onClose={() => setCreatingPlan(false)} /> : null}
      {editingPlan ? <PlanFormDialog plan={editingPlan} open={Boolean(editingPlan)} onClose={() => setEditingPlan(undefined)} /> : null}
      {deletingPlan ? (
        <ConfirmDialog
          open={Boolean(deletingPlan)}
          title="Delete subscription plan"
          description={`Delete ${deletingPlan.name}? Only plans with no owners can be deleted.`}
          isLoading={deletePlan.isPending}
          onCancel={() => setDeletingPlan(undefined)}
          onConfirm={() => deletePlan.mutate(deletingPlan.id, { onSuccess: () => setDeletingPlan(undefined) })}
        />
      ) : null}
    </div>
  );
}
