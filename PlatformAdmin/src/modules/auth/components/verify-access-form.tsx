"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { authApi } from "@/modules/auth/api/auth.api";
import { setAuthSession } from "@/modules/auth/lib/auth-session";
import { verifyAccessSchema } from "@/modules/auth/schemas/auth.schema";
import { useAuthStore } from "@/modules/auth/stores/auth.store";

type VerifyAccessFormValues = z.infer<typeof verifyAccessSchema>;

export function VerifyAccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get("email") ?? "";
  const setUser = useAuthStore((state) => state.setUser);
  const form = useForm<VerifyAccessFormValues>({
    resolver: zodResolver(verifyAccessSchema),
    defaultValues: { email: emailFromQuery, code: "" }
  });

  useEffect(() => {
    if (emailFromQuery) {
      form.setValue("email", emailFromQuery);
    }
  }, [emailFromQuery, form]);

  const verify = useMutation({
    mutationFn: authApi.verifyAccess,
    onSuccess: (data) => {
      setAuthSession(data);
      setUser(data.user);
      router.push("/dashboard");
    }
  });

  const resend = useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => {
      form.clearErrors("code");
    }
  });

  return (
    <div className="w-full max-w-[430px]">
      <div className="mb-6 flex justify-center">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-white shadow-sm">
            <Image src="/Layer_1.svg" alt="" width={25} height={31} className="h-6 w-5" priority />
          </span>
          <span className="text-lg font-extrabold text-primary">BobaPos</span>
        </div>
      </div>

      <form
        className="rounded-lg bg-white px-8 py-10 text-center shadow-[0_24px_70px_rgba(28,52,93,0.10)]"
        onSubmit={form.handleSubmit((values) => verify.mutate(values))}
      >
        <div>
          <h2 className="text-2xl font-extrabold leading-tight tracking-normal text-[#111d2f]">Khôi phục quyền truy cập</h2>
          <p className="mx-auto mt-5 max-w-[330px] text-sm leading-5 text-[#555c6b]">
            Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến{" "}
            <strong>{form.watch("email") || "email của bạn"}</strong>. Vui lòng nhập mã bên dưới để tiếp tục.
          </p>
        </div>

        <input type="hidden" {...form.register("email")} />

        <div className="mt-10">
          <label htmlFor="code" className="sr-only">
            Mã xác thực
          </label>
          <input
            id="code"
            inputMode="numeric"
            maxLength={8}
            placeholder="••••••"
            className="h-14 w-full border-0 border-b-2 border-[#c7cbd7] bg-transparent px-3 text-center text-2xl font-bold tracking-[1rem] text-[#111d2f] outline-none placeholder:text-[#7a8293] focus:border-primary"
            {...form.register("code")}
          />
          {form.formState.errors.code ? (
            <p className="mt-2 text-xs font-medium text-destructive">{form.formState.errors.code.message}</p>
          ) : null}
          {verify.isError ? (
            <p className="mt-2 text-xs font-medium text-destructive">Mã xác thực không hợp lệ hoặc đã hết hạn.</p>
          ) : null}
        </div>

        <Button className="mt-8 h-14 w-full rounded bg-primary text-sm font-bold shadow-sm" disabled={verify.isPending}>
          Xác thực
          <ArrowRight className="h-4 w-4" />
        </Button>
        <button
          type="button"
          className="mt-3 flex h-12 w-full items-center justify-center gap-3 rounded border border-primary bg-white text-sm font-semibold text-primary hover:bg-primary/5"
          disabled={resend.isPending || !form.watch("email")}
          onClick={() => {
            const email = form.getValues("email");
            if (email) resend.mutate({ email });
          }}
        >
          <RotateCcw className="h-4 w-4" />
          Gửi lại mã
        </button>

        <div className="mt-8 border-t border-[#eef1f6] pt-7">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4f5564] hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
}
