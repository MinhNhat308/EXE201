"use client";

import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { authApi } from "@/modules/auth/api/auth.api";
import { clearAuthSession, getAccessToken } from "@/modules/auth/lib/auth-session";
import { useAuthStore } from "@/modules/auth/stores/auth.store";

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const setUser = useAuthStore((state) => state.setUser);
  const [token, setToken] = useState<string | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    const storedToken = getAccessToken();
    setToken(storedToken);
    setCheckedStorage(true);

    if (!storedToken) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router]);

  const profile = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.me,
    enabled: Boolean(token),
    retry: false
  });

  useEffect(() => {
    if (profile.data) {
      setUser(profile.data);
    }
  }, [profile.data, setUser]);

  useEffect(() => {
    if (profile.isError) {
      setUser(null);
      clearAuthSession();
      router.replace("/login");
    }
  }, [profile.isError, router, setUser]);

  if (!checkedStorage || !token || profile.isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm font-semibold text-muted-foreground">
        Checking authentication...
      </div>
    );
  }

  return children;
}
