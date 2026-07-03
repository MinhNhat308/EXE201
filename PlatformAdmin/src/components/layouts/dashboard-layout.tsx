import { ReactNode } from "react";
import { Sidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-foreground dark:bg-background">
      <Sidebar />
      <div className="lg:pl-[296px]">
        <Topbar />
        <main className="px-5 py-6 sm:px-6 lg:px-8 xl:px-10">{children}</main>
        <footer className="px-5 pb-8 text-xs font-semibold uppercase tracking-widest text-slate-300 dark:text-slate-700 sm:px-6 lg:px-10">
          © 2026 BobaPos Admin Executive Suite. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
