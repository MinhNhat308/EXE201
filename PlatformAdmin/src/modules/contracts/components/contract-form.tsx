"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Box, CheckCircle2, Eye, FileText, Printer, Search, ShieldCheck, UserRound, ZoomIn } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useTenants } from "@/modules/tenants/api/tenant.queries";
import { contractSchema } from "@/modules/contracts/schemas/contract.schema";
import type { ContractStatus } from "@/modules/contracts/types/contract.types";

type ContractFormValues = z.infer<typeof contractSchema>;

const inputClassName =
  "h-11 rounded-xl border-0 bg-slate-100 px-4 text-sm shadow-none focus:ring-2 focus:ring-primary/30 dark:bg-slate-900";

function SectionTitle({ icon: Icon, children }: { icon: typeof FileText; children: string }) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <Icon className="h-5 w-5 text-primary" />
      <h2 className="text-base font-extrabold text-slate-950 dark:text-white">{children}</h2>
    </div>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <label className="text-[11px] font-bold uppercase tracking-normal text-slate-600 dark:text-slate-300">{children}</label>;
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="text-xs font-medium text-destructive">{error}</p> : null;
}

export function ContractForm({
  onSubmit,
  isSubmitting,
  formId = "contract-form",
  initialValues,
  submitLabel = "Tạo và Gửi hợp đồng"
}: {
  onSubmit: (values: ContractFormValues) => void;
  isSubmitting?: boolean;
  formId?: string;
  initialValues?: Partial<ContractFormValues>;
  submitLabel?: string;
}) {
  const tenants = useTenants({ page: 1, limit: 100, search: "", filters: {} });
  const form = useForm<ContractFormValues>({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      tenantId: initialValues?.tenantId ?? "",
      plan: "saas_subscription",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      amount: 48000000,
      status: "pending",
      durationMonths: 12,
      additionalTerms: "",
      ...initialValues
    }
  });
  const plan = form.watch("plan");
  const amount = form.watch("amount");
  const tenantId = form.watch("tenantId");
  const status = form.watch("status") ?? "pending";
  const durationMonths = form.watch("durationMonths") ?? 12;
  const selectedTenant = tenants.data?.data.find((tenant) => tenant.id === tenantId);
  const selectedOwnerName = selectedTenant?.ownerName ?? "Chọn owner";
  const selectedOwnerEmail = selectedTenant?.ownerEmail ?? "Chưa chọn owner";
  const selectedStoreName = selectedTenant?.name ?? "Chưa chọn cửa hàng";
  const planName =
    plan === "franchise" ? "Franchise" : plan === "support" ? "Support" : "SaaS Subscription";
  const formattedAmount = new Intl.NumberFormat("vi-VN").format(Number(amount || 0));
  const statusOptions: { value: ContractStatus; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "expired", label: "Expired" }
  ];

  return (
    <form id={formId} className="grid gap-8 xl:grid-cols-[minmax(0,620px)_360px]" onSubmit={form.handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <SectionTitle icon={FileText}>Thông tin chung</SectionTitle>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Mã hợp đồng</FieldLabel>
              <Input className={inputClassName} disabled value="Tự động tạo" />
            </div>
            <div className="space-y-2">
              <FieldLabel>Ngày ký</FieldLabel>
              <Input className={inputClassName} type="date" {...form.register("startDate")} />
              <FieldError error={form.formState.errors.startDate?.message} />
            </div>
            <div className="space-y-3 md:col-span-2">
              <FieldLabel>Loại hợp đồng</FieldLabel>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { label: "SaaS Subscription", value: "saas_subscription" },
                  { label: "Franchise", value: "franchise" },
                  { label: "Support", value: "support" }
                ].map((option) => {
                  const active = plan === option.value;
                  return (
                    <label
                      key={option.value}
                      className={
                        active
                          ? "flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-primary bg-primary/5 text-center text-sm font-bold text-primary"
                          : "flex h-20 cursor-pointer items-center justify-center rounded-xl border border-slate-100 bg-slate-100 text-center text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      }
                    >
                      <input className="sr-only" type="radio" value={option.value} {...form.register("plan")} />
                      {active ? <CheckCircle2 className="h-4 w-4" /> : null}
                      {option.label}
                    </label>
                  );
                })}
              </div>
              <FieldError error={form.formState.errors.plan?.message} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <SectionTitle icon={UserRound}>Đối tác (Owner)</SectionTitle>
          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Select className="h-14 rounded-xl border-0 bg-slate-100 pl-11 text-sm dark:bg-slate-900" {...form.register("tenantId")}>
                <option value="">Chọn owner / cửa hàng</option>
                {(tenants.data?.data ?? []).map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.ownerName} - {tenant.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-slate-900 to-primary text-sm font-bold text-white">
                {selectedOwnerName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-950 dark:text-white">{selectedOwnerName}</p>
                <p className="truncate text-xs text-slate-500">{selectedOwnerEmail} - {selectedStoreName}</p>
              </div>
            </div>
            <FieldError error={form.formState.errors.tenantId?.message} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <SectionTitle icon={Box}>Chi tiết gói dịch vụ</SectionTitle>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <FieldLabel>Chọn gói</FieldLabel>
              <Select className={inputClassName} value={plan} onChange={(event) => form.setValue("plan", event.target.value, { shouldValidate: true })}>
                <option value="saas_subscription">Premium Plan</option>
                <option value="franchise">Franchise Plan</option>
                <option value="support">Support Plan</option>
              </Select>
            </div>
            <div className="space-y-2">
              <FieldLabel>Thời hạn (tháng)</FieldLabel>
              <Select
                className={inputClassName}
                value={String(durationMonths)}
                onChange={(event) => {
                  const months = Number(event.target.value);
                  form.setValue("durationMonths", months, { shouldValidate: true });
                  const startDate = new Date(form.getValues("startDate"));
                  startDate.setMonth(startDate.getMonth() + months);
                  form.setValue("endDate", startDate.toISOString().slice(0, 10), { shouldValidate: true });
                }}
              >
                <option value="12">12 Tháng</option>
                <option value="24">24 Tháng</option>
                <option value="36">36 Tháng</option>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <FieldLabel>Giá trị hợp đồng (VND)</FieldLabel>
              <div className="relative">
                <Input className={`${inputClassName} pr-16 text-lg font-extrabold text-primary`} type="number" {...form.register("amount")} />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">VNĐ</span>
              </div>
              <FieldError error={form.formState.errors.amount?.message} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Ngày hết hạn</FieldLabel>
              <Input className={inputClassName} type="date" {...form.register("endDate")} />
              <FieldError error={form.formState.errors.endDate?.message} />
            </div>
            <div className="space-y-2">
              <FieldLabel>Trạng thái</FieldLabel>
              <Select className={inputClassName} value={status} onChange={(event) => form.setValue("status", event.target.value as ContractStatus, { shouldValidate: true })}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
              <FieldError error={form.formState.errors.status?.message} />
            </div>
          </div>
        </section>

        <section className="rounded-none border-4 border-dashed border-primary bg-white p-6 dark:bg-slate-950">
          <h2 className="mb-4 border border-dashed border-primary px-4 py-2 text-base font-extrabold text-slate-950 dark:text-white">Điều khoản bổ sung</h2>
          <textarea
            className="min-h-32 w-full resize-none border border-dashed border-primary bg-slate-50 p-4 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 dark:bg-slate-900"
            placeholder="Nhập các thỏa thuận riêng hoặc ưu đãi đặc biệt dành cho đối tác..."
            {...form.register("additionalTerms")}
          />
        </section>

        <div className="flex flex-wrap items-center justify-end gap-4 pt-2">
          <Link href="/contracts" className="inline-flex h-11 items-center px-4 text-sm font-bold text-slate-700 hover:text-primary dark:text-slate-300">
            Hủy bỏ
          </Link>
          <Button type="button" variant="secondary" className="h-11 min-w-36 rounded-xl bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200">
            Lưu bản nháp
          </Button>
          <Button className="h-11 min-w-44 rounded-xl shadow-[0_10px_20px_rgba(47,128,237,0.25)]" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="mb-4 flex items-center justify-between text-sm font-extrabold uppercase tracking-[0.12em] text-slate-700 dark:text-slate-300">
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Xem trước hợp đồng
          </span>
          <span className="flex items-center gap-4">
            <ZoomIn className="h-4 w-4" />
            <Printer className="h-4 w-4" />
          </span>
        </div>
        <div className="bg-white p-8 shadow-sm dark:bg-slate-950">
          <div className="flex items-start justify-between border-b border-slate-200 pb-8 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-primary/30 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold">BobaPOS</span>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase text-primary">Mã hợp đồng</p>
              <p className="font-semibold">Tự động tạo</p>
            </div>
          </div>

          <div className="py-10 text-center">
            <h3 className="text-2xl font-medium uppercase tracking-normal text-slate-800 dark:text-slate-100">Thỏa thuận dịch vụ</h3>
            <p className="mt-1 text-xl font-bold uppercase">{planName}</p>
            <p className="mt-6 text-xs text-slate-400">Số: 0892/2023/HD-TEAF-VN</p>
          </div>

          <div className="space-y-6 text-xs leading-6">
            <div>
              <p className="border-b border-slate-200 pb-2 font-extrabold uppercase dark:border-slate-800">Bên A: Công ty cổ phần công nghệ BobaPOS</p>
              <dl className="mt-3 grid grid-cols-[80px_1fr] gap-y-2 text-slate-600 dark:text-slate-300">
                <dt>Đại diện:</dt><dd>Ông Trần Công Tâm  - Giám đốc điều hành</dd>
                <dt>Trụ sở:</dt><dd>Tòa nhà Innovation, Công viên phần mềm Quang Trung, TP.HCM</dd>
              </dl>
            </div>
            <div>
              <p className="border-b border-slate-200 pb-2 font-extrabold uppercase dark:border-slate-800">Bên B: Đối tác sử dụng dịch vụ</p>
              <dl className="mt-3 grid grid-cols-[80px_1fr] gap-y-2 text-slate-600 dark:text-slate-300">
                <dt>Người đại diện:</dt><dd>{selectedOwnerName}</dd>
                <dt>Đơn vị:</dt><dd>{selectedStoreName}</dd>
                <dt>Email:</dt><dd>{selectedOwnerEmail}</dd>
              </dl>
            </div>
            <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-900">
              <p className="font-bold text-slate-950 dark:text-white">Giá trị hợp đồng: {formattedAmount} VNĐ</p>
              <p className="mt-1 text-slate-500">Thời hạn: {durationMonths} tháng kể từ ngày ký.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p>Hợp đồng này sẽ được mã hóa và ký số thông qua cổng bảo mật BobaPOS SecureSign ngay sau khi bạn nhấn “Tạo và Gửi”.</p>
        </div>
      </aside>
    </form>
  );
}
