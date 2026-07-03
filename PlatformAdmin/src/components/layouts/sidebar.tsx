"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  FileText,
  KeyRound,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Store,
  UserCog,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/owners", label: "Owners", icon: UserCog },
  { href: "/tenants", label: "Stores", icon: Store },
  { href: "/employees", label: "Employees", icon: Users },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/licenses", label: "Licenses", icon: KeyRound },
  { href: "/subscription-plans", label: "Subscription Plans", icon: ClipboardList },

  { href: "/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[296px] flex-col border-r border-slate-200/80 bg-white/85 px-5 py-6 shadow-[12px_0_40px_rgba(15,23,42,0.03)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 lg:flex">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl px-2 py-1">
        <span className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Image src="/Layer_1.svg" alt="BOBA POS" width={25} height={31} className="h-8 w-[26px]" priority />
        </span>
        <span>
          <span className="block text-lg font-extrabold tracking-normal text-slate-950 dark:text-white">TeaFlow</span>
          <span className="block text-xs font-semibold uppercase tracking-[0.16em] text-primary">BobaPOS Admin</span>
        </span>
      </Link>

      <nav className="mt-9 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white",
                active &&
                "bg-primary text-white shadow-[0_12px_24px_rgba(47,128,237,0.22)] hover:bg-primary hover:text-white dark:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-4">
        <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 via-white to-white p-4 shadow-sm dark:from-primary/15 dark:via-slate-900 dark:to-slate-950">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-950 dark:text-white">Enterprise support</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Priority SLA active</p>
            </div>
          </div>
          <Button className="mt-4 h-10 w-full rounded-xl">Open ticket</Button>
        </div>

        <Link
          className="flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-primary dark:text-slate-400 dark:hover:bg-slate-900"
          href="/settings/support"
        >
          <LifeBuoy className="h-5 w-5" />
          Support Center
        </Link>

        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-sm font-bold text-white dark:bg-white dark:text-slate-950">
            SA
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-950 dark:text-white">System Admin</p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">admin@teaflow.io</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
