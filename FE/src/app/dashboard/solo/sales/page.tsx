import { Suspense } from 'react';
import { SoloSalesView } from '@/views/solo/SoloSalesView';

export default function SoloSalesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-stone-500">Đang tải...</div>}>
      <SoloSalesView />
    </Suspense>
  );
}
