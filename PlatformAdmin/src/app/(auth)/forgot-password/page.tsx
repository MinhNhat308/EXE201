import { AuthLayout } from "@/components/layouts/auth-layout";
import { ForgotPasswordForm } from "@/modules/auth/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout title="Bạn quên mất tài khoản hoặc mật khẩu đăng nhập?">
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
