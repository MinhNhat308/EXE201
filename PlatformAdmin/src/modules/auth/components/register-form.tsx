"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowRight, Eye, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { authApi } from "@/modules/auth/api/auth.api";
import { setAuthSession } from "@/modules/auth/lib/auth-session";
import { registerSchema } from "@/modules/auth/schemas/auth.schema";
import { useAuthStore } from "@/modules/auth/stores/auth.store";

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" }
  });
  const register = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      authApi.register({
        fullName: values.fullName,
        email: values.email,
        password: values.password
    }),
    onSuccess: (data) => {
      setAuthSession(data);
      setUser(data.user);
      router.push("/dashboard");
    }
  });

  return (
    <form className="w-full max-w-[430px]" onSubmit={form.handleSubmit((values) => register.mutate(values))}>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold leading-none tracking-normal text-[#111d2f]">ĐĂNG KÝ</h2>
        <p className="mt-3 text-base text-[#555c6b]">Tạo tài khoản quản trị để bắt đầu sử dụng hệ thống.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="fullName" className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#4f5564]">
            Họ và tên
          </label>
          <div className="relative mt-3">
            <input
              id="fullName"
              placeholder="System Admin"
              className="h-12 w-full border-0 border-b-2 border-[#c7cbd7] bg-transparent pr-10 text-base text-[#111d2f] outline-none placeholder:text-[#b7bac4] focus:border-primary"
              {...form.register("fullName")}
            />
            <UserRound className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b8bdcb]" />
          </div>
          {form.formState.errors.fullName ? <p className="mt-2 text-xs font-medium text-destructive">{form.formState.errors.fullName.message}</p> : null}
        </div>

        <div>
          <label htmlFor="email" className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#4f5564]">
            Email
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
          {form.formState.errors.email ? <p className="mt-2 text-xs font-medium text-destructive">{form.formState.errors.email.message}</p> : null}
        </div>

        {[
          { name: "password" as const, label: "Mật khẩu" },
          { name: "confirmPassword" as const, label: "Nhập lại mật khẩu" }
        ].map((field) => (
          <div key={field.name}>
            <label htmlFor={field.name} className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#4f5564]">
              {field.label}
            </label>
            <div className="relative mt-3">
              <input
                id={field.name}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="h-12 w-full border-0 border-b-2 border-[#c7cbd7] bg-transparent pr-10 text-base text-[#111d2f] outline-none placeholder:text-[#b7bac4] focus:border-primary"
                {...form.register(field.name)}
              />
              <button
                type="button"
                aria-label="Hiện hoặc ẩn mật khẩu"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-1 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded text-[#b8bdcb] hover:text-primary"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
            {form.formState.errors[field.name] ? <p className="mt-2 text-xs font-medium text-destructive">{form.formState.errors[field.name]?.message}</p> : null}
          </div>
        ))}
      </div>

      <Button className="mt-10 h-14 w-full rounded bg-primary text-lg font-bold shadow-sm" disabled={register.isPending}>
        Tạo tài khoản
        <ArrowRight className="h-6 w-6" />
      </Button>
      {register.isError ? (
        <p className="mt-3 text-center text-sm font-semibold text-destructive">
          Email này đã được đăng ký hoặc thông tin chưa hợp lệ.
        </p>
      ) : null}

      <p className="mt-8 text-center text-sm text-[#555c6b]">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Đăng nhập
        </Link>
      </p>
    </form>
  );
}
