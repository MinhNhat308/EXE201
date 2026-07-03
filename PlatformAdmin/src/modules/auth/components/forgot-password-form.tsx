"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { authApi } from "@/modules/auth/api/auth.api";
import { forgotPasswordSchema } from "@/modules/auth/schemas/auth.schema";

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const router = useRouter();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" }
  });
  const forgotPassword = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: (_data, variables) => {
      router.push(`/verify-access?email=${encodeURIComponent(variables.email)}`);
    }
  });

  return (
    <form className="w-full max-w-[430px]" onSubmit={form.handleSubmit((values) => forgotPassword.mutate(values))}>
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold leading-tight tracking-normal text-[#111d2f]">Khôi phục đăng nhập</h2>
        <p className="mt-3 max-w-[310px] text-sm leading-5 text-[#555c6b]">
          Nhập địa chỉ email công việc của bạn để nhận mã xác thực 6 chữ số.
        </p>
      </div>

      <div>
        <label htmlFor="email" className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#4f5564]">
          Tên đăng nhập
        </label>
        <div className="relative mt-3">
          <input
            id="email"
            type="email"
            placeholder="executive@teaops.com"
            className="h-12 w-full border-0 border-b-2 border-[#c7cbd7] bg-transparent pr-10 text-sm text-[#111d2f] outline-none placeholder:text-[#b7bac4] focus:border-primary"
            {...form.register("email")}
          />
          <Mail className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-[#b8bdcb]" />
        </div>
        {form.formState.errors.email ? (
          <p className="mt-2 text-xs font-medium text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <Button className="mt-10 h-14 w-full rounded bg-primary text-sm font-bold uppercase shadow-[0_10px_18px_rgba(47,128,237,0.24)]" disabled={forgotPassword.isPending}>
        Gửi mã xác thực
        <ArrowRight className="h-4 w-4" />
      </Button>

      <div className="mt-8 text-center">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4f5564] hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Quay lại đăng nhập
        </Link>
      </div>

      <div className="mt-20 border-t border-[#eef1f6] pt-8">
        <div className="rounded-md bg-[#edf4ff] p-5">
          <div className="flex gap-4">
            <ShieldCheck className="mt-1 h-5 w-5 flex-none text-[#007a7a]" />
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-normal text-[#4f5564]">Security protocol</p>
              <p className="mt-2 text-xs leading-5 text-[#7a8293]">
                Mã xác thực sẽ hết hạn sau 15 phút. Vui lòng liên hệ quản trị viên nếu không thể truy cập email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
