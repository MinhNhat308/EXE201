import { AuthLayout } from "@/components/layouts/auth-layout";
import { LoginForm } from "@/modules/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthLayout title="Chào mừng bạn quay trở lại hệ thống">
      <LoginForm />
    </AuthLayout>
  );
}
