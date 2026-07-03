import { Suspense } from 'react';
import { BRAND } from '@/lib/brand';
import { LoginView } from '@/views/auth/LoginView';

function LoginFallback() {
  return (
    <div className={`flex min-h-screen items-center justify-center ${BRAND.pageBg}`}>
      <div className={`h-11 w-11 animate-spin rounded-full border-4 ${BRAND.spinner}`} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginView />
    </Suspense>
  );
}
