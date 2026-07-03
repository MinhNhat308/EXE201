"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getAccessToken } from "@/modules/auth/lib/auth-session";

export function GuestGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/dashboard");
      return;
    }

    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f7fc] text-sm font-semibold text-[#555c6b]">
        Checking session...
      </div>
    );
  }

  return children;
}
