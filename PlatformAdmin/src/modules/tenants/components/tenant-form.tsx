"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Building2, CheckCircle2, Eye, QrCode, ShieldCheck, Store, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useSubscriptionPlansOverview } from "@/modules/subscription-plans/api/subscription-plan.queries";
import { createTenantSchema, tenantSchema, updateTenantSchema } from "@/modules/tenants/schemas/tenant.schema";
import type { CreateTenantDto, TenantDto, TenantStatus, UpdateTenantDto } from "@/modules/tenants/types/tenant.types";

type TenantFormValues = z.infer<typeof tenantSchema>;
type FieldError = string | undefined;

const inputClassName =
  "h-9 rounded-none border-0 border-b border-slate-300 bg-transparent px-0 text-sm shadow-none focus:ring-0 focus:border-primary dark:border-slate-700 dark:bg-transparent";

const statusOptions: { value: TenantStatus; label: string; description: string }[] = [
  { value: "active", label: "Kích hoạt ngay", description: "Owner có thể sử dụng sau khi tạo." },
  { value: "pending", label: "Chờ kích hoạt", description: "Tạo hồ sơ nhưng chưa mở quyền sử dụng." },
  { value: "inactive", label: "Bản nháp", description: "Lưu thông tin, chưa đưa vào vận hành." },
  { value: "suspended", label: "Tạm khóa", description: "Chặn truy cập cho đến khi admin mở lại." }
];

const statusText: Record<TenantStatus, string> = {
  active: "Đã kích hoạt",
  pending: "Đang chờ kích hoạt",
  inactive: "Bản nháp",
  suspended: "Tạm khóa"
};

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="text-[11px] font-bold uppercase tracking-normal text-slate-700 dark:text-slate-300">{children}</label>;
}

function FieldErrorMessage({ error }: { error?: FieldError }) {
  return error ? <p className="text-xs font-medium text-destructive">{error}</p> : null;
}

function toFormValues(tenant?: TenantDto): TenantFormValues {
  return {
    name: tenant?.name ?? "",
    ownerName: tenant?.ownerName ?? "",
    ownerEmail: tenant?.ownerEmail ?? "",
    plan: tenant?.plan ?? "",
    status: tenant?.status ?? "active",
    location: tenant?.location ?? "",
    taxId: tenant?.taxId ?? "",
    businessLicense: tenant?.businessLicense ?? "",
    address: tenant?.address ?? "",
    ownerPhone: tenant?.ownerPhone ?? "",
    accountRole: (tenant?.accountRole as "super_admin" | "manager") ?? "super_admin",
    softwareVersion: tenant?.softwareVersion ?? "v2.4.1",
    contractDurationMonths: tenant?.contractDurationMonths ?? 12,
    setupFee: tenant?.setupFee ?? 250,
    monthlyFee: tenant?.monthlyFee ?? 0,
    discount: tenant?.discount ?? 0
  };
}

export function TenantForm({
  onSubmit,
  isSubmitting,
  submitLabel = "Save tenant",
  formId = "tenant-form",
  cancelHref = "/tenants",
  mode = "create",
  initialValues
}: {
  onSubmit: (values: CreateTenantDto | UpdateTenantDto) => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  formId?: string;
  cancelHref?: string;
  mode?: "create" | "edit";
  initialValues?: TenantDto;
}) {
  const subscriptionPlans = useSubscriptionPlansOverview();
  const planOptions = subscriptionPlans.data?.plans.filter((planOption) => planOption.status === "active") ?? [
    { name: "Starter", value: "starter", price: 0 },
    { name: "Premium", value: "premium", price: 1200 },
    { name: "Enterprise", value: "enterprise", price: 2400 }
  ];
  const schema = mode === "create" ? createTenantSchema : updateTenantSchema;
  const form = useForm<TenantFormValues & { initialPassword?: string }>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...toFormValues(initialValues),
      initialPassword: mode === "create" ? "TemporaryPass123" : undefined
    }
  });

  useEffect(() => {
    form.reset({
      ...toFormValues(initialValues),
      initialPassword: mode === "create" ? "TemporaryPass123" : undefined
    });
  }, [form, initialValues, mode]);

  const storeName = form.watch("name");
  const ownerName = form.watch("ownerName");
  const plan = form.watch("plan");
  const status = form.watch("status") ?? "active";
  const location = form.watch("location");
  const softwareVersion = form.watch("softwareVersion") ?? "v2.4.1";
  const setupFee = Number(form.watch("setupFee") ?? 0);
  const monthlyFee = Number(form.watch("monthlyFee") ?? 0);
  const discount = Number(form.watch("discount") ?? 0);
  const contractDurationMonths = Number(form.watch("contractDurationMonths") ?? 12);
  const selectedPlan = planOptions.find((planOption) => planOption.value === plan);
  const planLabel = selectedPlan?.name ?? (plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : "Premium");
  const effectiveMonthlyFee = monthlyFee || Number(selectedPlan?.price ?? 0) || 0;
  const totalInitial = setupFee + effectiveMonthlyFee - discount;

  const handleSubmit = (values: TenantFormValues & { initialPassword?: string }) => {
    const { initialPassword, ...rest } = values;
    if (mode === "create") {
      onSubmit({ ...rest, initialPassword: initialPassword ?? "TemporaryPass123" });
      return;
    }
    onSubmit(rest);
  };

  return (
    <form id={formId} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_288px]" onSubmit={form.handleSubmit(handleSubmit)}>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded bg-primary text-white">
              <Store className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">Thông tin doanh nghiệp</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Tên cửa hàng</FieldLabel>
              <Input className={inputClassName} placeholder="e.g. Azure Highlands Tea" {...form.register("name")} />
              <FieldErrorMessage error={form.formState.errors.name?.message} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Địa điểm / Chi nhánh</FieldLabel>
              <Input className={inputClassName} placeholder="e.g. Downtown Seattle" {...form.register("location")} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Mã số thuế (EIN)</FieldLabel>
              <Input className={inputClassName} placeholder="XX-XXXXXXX" {...form.register("taxId")} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Số giấy phép kinh doanh</FieldLabel>
              <Input className={inputClassName} placeholder="LIC-998822" {...form.register("businessLicense")} />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <FieldLabel>Địa chỉ kinh doanh đầy đủ</FieldLabel>
              <Input className={inputClassName} placeholder="123 Meridian Way, Suite 400, WA 98101" {...form.register("address")} />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded bg-primary text-white">
              <UserRound className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">Chủ sở hữu & Bảo mật</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel>Họ và tên đầy đủ</FieldLabel>
              <Input className={inputClassName} placeholder="Johnathan Doe" {...form.register("ownerName")} />
              <FieldErrorMessage error={form.formState.errors.ownerName?.message} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Số điện thoại</FieldLabel>
              <Input className={inputClassName} placeholder="+1 (555) 000-0000" {...form.register("ownerPhone")} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Địa chỉ email</FieldLabel>
              <Input className={inputClassName} placeholder="owner@shopdomain.com" {...form.register("ownerEmail")} />
              <FieldErrorMessage error={form.formState.errors.ownerEmail?.message} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Vai trò tài khoản</FieldLabel>
              <Select className={inputClassName} {...form.register("accountRole")}>
                <option value="super_admin">Super Admin (Full Access)</option>
                <option value="manager">Store Manager</option>
              </Select>
            </div>
            {mode === "create" ? (
              <div className="space-y-1.5 md:col-span-2">
                <FieldLabel>Mật khẩu hệ thống ban đầu</FieldLabel>
                <div className="relative">
                  <Input className={inputClassName} type="password" {...form.register("initialPassword")} />
                  <Eye className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                <FieldErrorMessage error={form.formState.errors.initialPassword?.message} />
                <p className="text-[11px] text-slate-400">Mật khẩu dùng để tạo tài khoản owner. Người dùng nên đặt lại khi đăng nhập lần đầu.</p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="rounded-lg border border-slate-100 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded bg-primary text-white">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">Kế hoạch dịch vụ & Triển khai</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-1.5">
              <FieldLabel>Gói dịch vụ</FieldLabel>
              <Select
                className={inputClassName}
                {...form.register("plan", {
                  onChange: (event) => {
                    const selected = planOptions.find((planOption) => planOption.value === event.target.value);
                    if (selected?.price) {
                      form.setValue("monthlyFee", Number(selected.price));
                    }
                  }
                })}
              >
                <option value="">Chọn gói</option>
                {planOptions.map((planOption) => (
                  <option key={planOption.value} value={planOption.value}>
                    {planOption.name}
                  </option>
                ))}
              </Select>
              <FieldErrorMessage error={form.formState.errors.plan?.message} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Phiên bản phần mềm</FieldLabel>
              <Select className={inputClassName} {...form.register("softwareVersion")}>
                <option value="v2.4.1">v2.4.1 (Stable)</option>
                <option value="v2.5.0">v2.5.0 (Beta)</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Thời hạn hợp đồng</FieldLabel>
              <Select className={inputClassName} {...form.register("contractDurationMonths")}>
                <option value="12">12 tháng</option>
                <option value="24">24 tháng</option>
                <option value="36">36 tháng</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Phí thiết lập (USD)</FieldLabel>
              <Input className={inputClassName} type="number" {...form.register("setupFee")} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Phí hàng tháng (USD)</FieldLabel>
              <Input className={inputClassName} type="number" {...form.register("monthlyFee")} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>Giảm giá (USD)</FieldLabel>
              <Input className={inputClassName} type="number" {...form.register("discount")} />
            </div>
            <div className="space-y-1.5 md:col-span-3">
              <FieldLabel>Trạng thái owner</FieldLabel>
              <Select className={inputClassName} {...form.register("status")}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <p className="text-[11px] text-slate-400">
                {statusOptions.find((option) => option.value === status)?.description}
              </p>
              <FieldErrorMessage error={form.formState.errors.status?.message} />
            </div>
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg bg-primary p-6 text-white shadow-[0_18px_36px_rgba(47,128,237,0.28)]">
          <div className="mb-8 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-100">Bản xem trước</p>
              <h3 className="mt-2 text-2xl font-extrabold leading-tight">{storeName || "Tên cửa"}<br />hàng thuê</h3>
              <p className="mt-3 flex items-center gap-2 text-xs text-blue-100">
                <span className="h-2 w-2 rounded-full bg-emerald-300" />
                {statusText[status]}
              </p>
            </div>
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-white/15">
              <Building2 className="h-5 w-5" />
            </span>
          </div>
          <div className="space-y-5 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase text-blue-100">Địa điểm hoạt động</p>
              <p className="mt-1 font-bold">{location || storeName || "Chưa nhập địa điểm"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-blue-100">Liên hệ chủ sở hữu</p>
              <p className="mt-1 font-bold">{ownerName || "Tên chủ sở hữu"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase text-blue-100">Cơ sở hạ tầng</p>
              <p className="mt-1 font-bold">{planLabel} - {softwareVersion}</p>
            </div>
          </div>
          <div className="mt-9 flex items-end justify-between border-t border-white/15 pt-5 text-[10px] text-blue-100">
            <span>{contractDurationMonths} tháng</span>
            <QrCode className="h-6 w-6 text-white" />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-blue-50/70 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <p className="mb-4 text-xs font-bold uppercase text-primary">Registration summary</p>
          <div className="space-y-3 text-sm">
            <p className="flex justify-between"><span>Setup Fee</span><strong>${setupFee.toFixed(2)}</strong></p>
            <p className="flex justify-between"><span>Monthly Plan</span><strong>${effectiveMonthlyFee.toFixed(2)}</strong></p>
            <p className="flex justify-between text-emerald-600"><span>Discounts</span><strong>-${discount.toFixed(2)}</strong></p>
          </div>
          <div className="mt-5 flex justify-between border-t border-blue-100 pt-4 text-base font-bold dark:border-slate-800">
            <span>Total Initial</span>
            <span className="text-primary">${totalInitial.toFixed(2)}</span>
          </div>
          <div className="mt-4 rounded bg-blue-100 p-3 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <CheckCircle2 className="mr-2 inline h-3.5 w-3.5 text-primary" />
            Quá trình thiết lập thường mất 3-5 phút. Người dùng sẽ nhận email chào mừng sau khi phân vùng cơ sở dữ liệu được kích hoạt.
          </div>
        </div>
      </aside>

      <div className="border-t border-slate-200 py-4 dark:border-slate-800 xl:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <p className="hidden text-xs text-slate-400 sm:block">
            {mode === "edit" && initialValues?.updatedAt
              ? `Cập nhật lần cuối: ${new Date(initialValues.updatedAt).toLocaleString("vi-VN")}`
              : "Điền đầy đủ thông tin trước khi tạo owner"}
          </p>
          <div className="ml-auto flex items-center gap-3">
            <Link className="inline-flex h-10 items-center justify-center rounded-md px-5 text-sm font-semibold transition-colors hover:bg-muted" href={cancelHref}>
              Hủy bỏ
            </Link>
            <Button className="min-w-36 shadow-[0_10px_20px_rgba(47,128,237,0.25)]" disabled={isSubmitting} type="submit">
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
