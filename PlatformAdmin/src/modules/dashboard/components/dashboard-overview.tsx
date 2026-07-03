"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Circle,
  Database,
  FileText,
  Plus,
  Server,
  ShieldCheck,
  Store,
  TrendingUp,
  UserCog,
  Users,
  Zap
} from "lucide-react";
import { StatusBadge } from "@/components/common/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { useDashboardOverview } from "@/modules/dashboard/api/dashboard.queries";
import type { DashboardMetricDto, RegistrationTrendDto, RevenuePointDto } from "@/modules/dashboard/types/dashboard.types";

const metricIcons = {
  owners: UserCog,
  stores: Store,
  employees: Users,
  contractsExpiringSoon: FileText
};

const metricTones = {
  owners: "from-primary/15 text-primary ring-primary/15",
  stores: "from-emerald-500/15 text-emerald-600 ring-emerald-500/15 dark:text-emerald-300",
  employees: "from-indigo-500/15 text-indigo-600 ring-indigo-500/15 dark:text-indigo-300",
  contractsExpiringSoon: "from-amber-500/15 text-amber-600 ring-amber-500/15 dark:text-amber-300"
};

const planColors = ["bg-sky-400", "bg-primary", "bg-indigo-500", "bg-amber-400", "bg-emerald-500"];

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

function formatRelativeTime(value: string) {
  const createdAt = new Date(value).getTime();
  const seconds = Math.max(0, Math.floor((Date.now() - createdAt) / 1000));
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function buildPolyline(points: number[], width: number, height: number) {
  const max = Math.max(1, ...points);
  const step = points.length > 1 ? width / (points.length - 1) : width;
  return points
    .map((value, index) => {
      const x = index * step;
      const y = height - (value / max) * (height - 16) - 8;
      return `${x},${y}`;
    })
    .join(" ");
}

function GrowthChart({ points }: { points: RegistrationTrendDto[] }) {
  const chartPoints = points.length > 0 ? points : [{ month: "Now", owners: 0, stores: 0 }];
  const ownerLine = buildPolyline(chartPoints.map((point) => point.owners), 490, 210);
  const storeLine = buildPolyline(chartPoints.map((point) => point.stores), 490, 210);

  return (
    <div className="relative h-[330px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/70 p-5 dark:border-slate-800 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/20">
      <div className="absolute inset-x-6 top-8 grid h-[230px] grid-rows-4">
        {[0, 1, 2, 3].map((line) => (
          <div key={line} className="border-t border-dashed border-slate-200 dark:border-slate-800" />
        ))}
      </div>
      <svg viewBox="0 0 490 210" className="relative z-10 h-[250px] w-full overflow-visible" role="img" aria-label="Owner and store growth chart">
        <polyline points={storeLine} fill="none" stroke="#2F80ED" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        <polyline points={ownerLine} fill="none" stroke="#10B981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
      </svg>
      <div className="grid text-xs font-semibold text-slate-400" style={{ gridTemplateColumns: `repeat(${chartPoints.length}, minmax(0, 1fr))` }}>
        {chartPoints.map((point) => (
          <span key={point.month} className="text-center">
            {point.month}
          </span>
        ))}
      </div>
    </div>
  );
}

function RevenueBars({ points }: { points: RevenuePointDto[] }) {
  const bars = points.length > 0 ? points : [{ month: "Now", amount: 0 }];
  const max = Math.max(1, ...bars.map((point) => point.amount));

  return (
    <div className="mt-6 flex h-56 items-end gap-3 rounded-2xl border border-slate-200 bg-gradient-to-b from-blue-50/60 to-white p-5 dark:border-slate-800 dark:from-blue-950/20 dark:to-slate-950">
      {bars.map((point) => (
        <div key={point.month} className="flex flex-1 flex-col items-center gap-3">
          <div
            className="w-full rounded-t-xl bg-gradient-to-t from-primary to-sky-300 shadow-[0_8px_18px_rgba(47,128,237,0.20)] transition hover:opacity-80"
            style={{ height: `${Math.max(4, (point.amount / max) * 100)}%` }}
          />
          <span className="text-[10px] font-bold uppercase text-slate-400">{point.month}</span>
        </div>
      ))}
    </div>
  );
}

function MetricCard({ metric }: { metric: DashboardMetricDto }) {
  const Icon = metricIcons[metric.key];

  return (
    <Card className="group border-slate-200/80 bg-white/90 shadow-[0_12px_34px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <span className={cn("grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br to-transparent ring-1", metricTones[metric.key])}>
            <Icon className="h-5 w-5" />
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <TrendingUp className="h-3 w-3" />
            Live
          </span>
        </div>
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{metric.label}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-normal text-slate-950 dark:text-white">{formatNumber(metric.value)}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{metric.detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardOverview() {
  const overview = useDashboardOverview();
  const data = overview.data;
  const totalPlans = data?.planOverview.reduce((sum, plan) => sum + plan.value, 0) ?? 0;
  const growthRate = data?.revenue.growthRate ?? 0;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-white via-white to-blue-50 p-6 shadow-sm dark:border-primary/20 dark:from-slate-950 dark:via-slate-950 dark:to-blue-950/20 lg:p-8">
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur dark:bg-slate-900/70">
              <ShieldCheck className="h-3.5 w-3.5" />
              System Administrator Console
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold tracking-normal text-slate-950 dark:text-white lg:text-4xl">
              TeaFlow platform command center
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
              Manage owners, stores, employees, contracts, subscriptions, and platform health across the BobaPOS network.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* <button className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <Download className="h-4 w-4" />
              Export Report
            </button> */}
            <Link href="/owners/new" className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-bold text-white shadow-[0_14px_28px_rgba(47,128,237,0.25)] transition hover:-translate-y-0.5 hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Create Owner
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(data?.metrics ?? []).map((metric) => (
          <MetricCard key={metric.key} metric={metric} />
        ))}
        {!data && [0, 1, 2, 3].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-900" />)}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="border-slate-200/80 bg-white/90 shadow-[0_16px_42px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-extrabold">Owner & Store Growth</CardTitle>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last 12 months from tenant creation data.</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="mb-4 flex flex-wrap gap-4 text-sm font-semibold">
              <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Circle className="h-3 w-3 fill-emerald-500 text-emerald-500" /> Active owners
              </span>
              <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <Circle className="h-3 w-3 fill-primary text-primary" /> Stores
              </span>
            </div>
            <GrowthChart points={data?.registrationTrends ?? []} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <CardHeader className="p-5">
              <CardTitle className="text-lg font-extrabold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-5 pt-0">
              {[
                { label: "Create Owner", href: "/owners/new", icon: UserCog },
                { label: "Create Contract", href: "/contracts/new", icon: FileText },
                { label: "Add Employee", href: "/employees/new", icon: Users }
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="group flex h-12 items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-primary/30 hover:bg-white hover:text-primary hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-900">
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {action.label}
                    </span>
                    <ArrowUpRight className="h-4 w-4 opacity-40 transition group-hover:opacity-100" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-gradient-to-br from-slate-950 to-slate-800 text-white shadow-[0_18px_40px_rgba(15,23,42,0.20)] dark:border-slate-800">
            <CardHeader className="p-5">
              <CardTitle className="flex items-center gap-2 text-lg font-extrabold text-white">
                <Zap className="h-5 w-5 text-primary" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5 pt-0">
              {[
                { label: "API Status", value: data?.health.api ?? "Checking", icon: ShieldCheck },
                { label: "Database Status", value: data?.health.database ?? "Checking", icon: Database },
                { label: "Server Status", value: data?.health.server ?? "Checking", icon: Server }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl bg-white/8 px-3 py-3 ring-1 ring-white/10 backdrop-blur">
                    <span className="flex items-center gap-3 text-sm font-semibold text-slate-200">
                      <Icon className="h-4 w-4 text-emerald-300" />
                      {item.label}
                    </span>
                    <span className="text-sm font-bold text-emerald-300">{item.value}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-extrabold">Platform Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6 pt-0">
            <div>
              <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-300">Total Owners by Subscription Plan</p>
              <div className="flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {(data?.planOverview ?? []).map((plan, index) => (
                  <div key={plan.label} className={planColors[index % planColors.length]} style={{ width: `${totalPlans > 0 ? (plan.value / totalPlans) * 100 : 0}%` }} />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(data?.planOverview ?? []).map((plan, index) => (
                  <div key={plan.label} className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                    <span className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className={cn("h-2.5 w-2.5 rounded-full", planColors[index % planColors.length])} />
                      {plan.label}
                    </span>
                    <p className="mt-2 text-xl font-extrabold text-slate-950 dark:text-white">{formatNumber(plan.value)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total Stores", value: formatNumber(data?.metrics.find((metric) => metric.key === "stores")?.value ?? 0), icon: Building2 },
                { label: "Active Owners", value: formatNumber(data?.metrics.find((metric) => metric.key === "owners")?.value ?? 0), icon: UserCog },
                { label: "Monthly Revenue", value: formatCurrency(data?.revenue.monthlyRevenue ?? 0), icon: BarChart3 },
                { label: "Active Contracts", value: formatNumber(data?.revenue.activeSubscriptions ?? 0), icon: FileText }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="mt-3 text-lg font-extrabold text-slate-950 dark:text-white">{item.value}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-extrabold">Recent Activities</CardTitle>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Latest administrative events across the platform.</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-y border-slate-100 bg-slate-50/80 text-left text-xs font-extrabold uppercase tracking-[0.12em] text-slate-400 dark:border-slate-800 dark:bg-slate-900/70">
                    <th className="px-6 py-3">Activity</th>
                    <th className="px-6 py-3">User</th>
                    <th className="px-6 py-3">Target</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.recentActivities ?? []).map((activity) => (
                    <tr key={activity.id} className="border-b border-slate-100 transition hover:bg-blue-50/40 dark:border-slate-800 dark:hover:bg-blue-950/10">
                      <td className="px-6 py-4 font-bold text-slate-950 dark:text-white">{activity.activity}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{activity.user}</td>
                      <td className="px-6 py-4 font-semibold text-primary">{activity.target}</td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatRelativeTime(activity.createdAt)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={activity.status.toLowerCase()} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {data?.recentActivities.length === 0 ? <p className="p-6 text-sm text-slate-500">No recent activity.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card className="border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl font-extrabold">Revenue Analytics</CardTitle>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Monthly contract value from signed contracts.</p>
            </div>
            <div className={cn("rounded-full px-3 py-1 text-sm font-bold", growthRate >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300")}>
              {growthRate >= 0 ? "+" : ""}
              {growthRate.toFixed(1)}% MoM
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { label: "Monthly Revenue", value: formatCurrency(data?.revenue.monthlyRevenue ?? 0) },
                { label: "Active Subscriptions", value: formatNumber(data?.revenue.activeSubscriptions ?? 0) },
                { label: "Growth Trend", value: `${growthRate >= 0 ? "+" : ""}${growthRate.toFixed(1)}%` }
              ].map((metric) => (
                <div key={metric.label} className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{metric.label}</p>
                  <p className="mt-3 text-2xl font-extrabold text-slate-950 dark:text-white">{metric.value}</p>
                </div>
              ))}
            </div>
            <RevenueBars points={data?.revenue.points ?? []} />
          </CardContent>
        </Card>

        <Card className="border-slate-200/80 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <CardHeader className="p-6">
            <CardTitle className="text-xl font-extrabold">Subscription Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6 pt-0">
            {(data?.planOverview ?? []).map((item, index) => {
              const percent = totalPlans > 0 ? Math.round((item.value / totalPlans) * 100) : 0;
              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="font-extrabold text-slate-950 dark:text-white">{percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className={cn("h-2 rounded-full", planColors[index % planColors.length])} style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
            <div className="mt-6 rounded-2xl border border-primary/15 bg-primary/10 p-4 text-primary dark:bg-primary/15">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5" />
                <p className="text-sm font-bold">Dashboard data is loaded from the current database collections.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
