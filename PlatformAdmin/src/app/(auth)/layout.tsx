import { ReactNode } from "react";
import { GuestGuard } from "@/modules/auth/components/guest-guard";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <GuestGuard>{children}</GuestGuard>;
}
