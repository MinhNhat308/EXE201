import { ReactNode } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { AuthGuard } from "@/modules/auth/components/auth-guard";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}
