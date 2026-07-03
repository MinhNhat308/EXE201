"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Eye, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { authApi } from "@/modules/auth/api/auth.api";
import { setAuthSession } from "@/modules/auth/lib/auth-session";
import { loginSchema } from "@/modules/auth/schemas/auth.schema";
import { useAuthStore } from "@/modules/auth/stores/auth.store";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });
  const login = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuthSession(data);
      setUser(data.user);
      const redirect = new URLSearchParams(window.location.search).get("redirect");
      router.push(redirect ?? "/dashboard");
    }
  });

  return (
    <form className="w-full max-w-[430px]" onSubmit={form.handleSubmit((values) => login.mutate(values))}>
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold leading-none tracking-normal text-[#111d2f]">ĐĂNG NHẬP</h2>
        <p className="mt-3 text-base text-[#555c6b]">Vui lòng nhập thông tin đăng nhập của bạn để truy cập</p>
      </div>

      <div className="space-y-7">
        <div>
          <label htmlFor="email" className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#4f5564]">
            Tên đăng nhập
          </label>
          <div className="relative mt-3">
            <input
              id="email"
              type="email"
              placeholder="admin@teaflow.io"
              className="h-12 w-full border-0 border-b-2 border-[#c7cbd7] bg-transparent pr-10 text-base text-[#111d2f] outline-none placeholder:text-[#b7bac4] focus:border-primary"
              {...form.register("email")}
            />
            <Mail className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b8bdcb]" />
          </div>
          {form.formState.errors.email ? (
            <p className="mt-2 text-xs font-medium text-destructive">{form.formState.errors.email.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#4f5564]">
            Password
          </label>
          <div className="relative mt-3">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-12 w-full border-0 border-b-2 border-[#c7cbd7] bg-transparent pr-10 text-base text-[#111d2f] outline-none placeholder:text-[#b7bac4] focus:border-primary"
              {...form.register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-[#b8bdcb] hover:text-primary"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
          {form.formState.errors.password ? (
            <p className="mt-2 text-xs font-medium text-destructive">{form.formState.errors.password.message}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 text-sm font-semibold text-[#555c6b]">
        <label className="flex items-center gap-3">
          <input type="checkbox" className="h-5 w-5 rounded border-[#c7cbd7] bg-[#f3f6fc] text-primary accent-primary" />
          Lưu đăng nhập
        </label>
        <Link href="/forgot-password" className="text-primary hover:underline">
          Quên mật khẩu?
        </Link>
      </div>

      <Button className="mt-12 h-14 w-full rounded bg-primary text-lg font-bold shadow-sm" disabled={login.isPending}>
        Đăng nhập vào hệ thống
        <ArrowRight className="h-6 w-6" />
      </Button>
      {login.isError ? (
        <p className="mt-3 text-center text-sm font-semibold text-destructive">Email hoặc mật khẩu không đúng.</p>
      ) : null}

      <div className="mt-20 border-t border-[#eef1f6] pt-10">
        <p className="text-center text-sm text-[#555c6b]">
          Bạn mới sử dụng nền tảng này?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Tạo tài khoản mới.
          </Link>
        </p>
      </div>
    </form>
  );
}
