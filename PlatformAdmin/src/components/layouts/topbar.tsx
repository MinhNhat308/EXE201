"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Settings, Sparkles } from "lucide-react";
import { GlobalSearch } from "@/components/layouts/global-search";
import { ThemeToggle } from "@/components/layouts/theme-toggle";
import { authApi } from "@/modules/auth/api/auth.api";
import { clearAuthSession } from "@/modules/auth/lib/auth-session";
import { useAuthStore } from "@/modules/auth/stores/auth.store";

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logoutStore = useAuthStore((state) => state.logout);

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Token may already be expired; client-side cleanup still needs to run.
    }

    clearAuthSession();
    logoutStore();
    router.replace("/login");
  }

  const initials = (user?.fullName ?? "System Admin")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/80 px-5 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 sm:px-6 lg:px-8 xl:px-10">
      <GlobalSearch />
      <div className="ml-4 flex items-center gap-2 sm:ml-6 sm:gap-3">
        <button className="hidden h-11 items-center gap-2 rounded-2xl border border-primary/15 bg-primary/10 px-4 text-sm font-bold text-primary transition hover:bg-primary hover:text-white xl:flex">
          <Sparkles className="h-4 w-4" />
          Admin AI
        </button>
        <ThemeToggle />
        <button aria-label="Notifications" className="relative grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Bell className="h-4 w-4" />
          <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
        </button>
        <Link aria-label="Settings" href="/settings" className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-primary/40 hover:text-primary dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Settings className="h-4 w-4" />
        </Link>
        <button aria-label="Logout" onClick={logout} className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-rose-300 hover:text-rose-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <LogOut className="h-4 w-4" />
        </button>
        <div className="hidden text-right md:block">
          <p className="text-sm font-bold text-slate-950 dark:text-white">{user?.fullName ?? "System Admin"}</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{user?.role ?? "Administrator"}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-slate-950 to-slate-700 text-sm font-bold text-white shadow-sm dark:from-white dark:to-slate-300 dark:text-slate-950">
          {initials}
        </div>
      </div>
    </header>
  );
}
