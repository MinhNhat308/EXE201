import { AuthLayout } from "@/components/layouts/auth-layout";
import { RegisterForm } from "@/modules/auth/components/register-form";

export default function RegisterPage() {
  return (
    <AuthLayout title="Khởi tạo tài khoản quản trị BobaPOS">
      <RegisterForm />
    </AuthLayout>
  );
}
