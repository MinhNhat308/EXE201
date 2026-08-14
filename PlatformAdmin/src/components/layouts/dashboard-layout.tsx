import { ReactNode } from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[rgba(47,128,237,0.08)] to-slate-100 text-foreground dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
      <Sidebar />
      <div className="lg:pl-[296px]">
        <Topbar />
        <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6 lg:px-8">{children}</main>
        <footer className="px-5 pb-8 text-xs font-semibold uppercase tracking-widest text-slate-300 dark:text-slate-700 sm:px-6 lg:px-10">
          © 2026 BobaPos Admin Executive Suite. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
