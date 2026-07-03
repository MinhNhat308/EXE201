'use client';

import Link from 'next/link';
import { BRAND } from '@/lib/brand';

const STEPS = [
  {
    n: '1',
    title: 'Đăng ký & chọn gói',
    desc: 'Tạo cửa hàng, chọn Solo · Store · Chain. Không cần thẻ tín dụng.',
    colors: 'from-[#2F80ED] to-sky-400',
  },
  {
    n: '2',
    title: '7 ngày trải nghiệm Premium',
    desc: 'Dùng đủ tính năng: POS, bếp, kho, kế toán, báo cáo — như gói cao nhất.',
    colors: 'from-emerald-500 to-teal-400',
  },
  {
    n: '3',
    title: 'Thanh toán để tiếp tục',
    desc: 'Hết trial → chuyển khoản / quét QR tại mục Thanh toán trong app.',
    colors: 'from-violet-500 to-fuchsia-400',
  },
];

export function TrialPaymentExplainer({
  variant = 'full',
  showBillingNote = true,
}: {
  variant?: 'full' | 'compact';
  showBillingNote?: boolean;
}) {
  if (variant === 'compact') {
    return (
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-sky-50 via-white to-violet-50 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-600">
          Cách hoạt động
        </p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          <strong className="text-stone-800">7 ngày trial Premium miễn phí</strong> → sau đó chủ
          quán thanh toán gói đã chọn tại{' '}
          <strong className="text-stone-800">Quản trị → Thanh toán & hóa đơn</strong> trong app.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-lg shadow-violet-100/40 sm:p-8">
      <div className="text-center">
        <span className="inline-flex rounded-full bg-rose-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-600">
          Trial → Thanh toán
        </span>
        <h2 className="mt-3 text-xl font-extrabold text-stone-900 sm:text-2xl">
          Đăng ký xong — rồi sao?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm text-stone-500">
          Không thu phí khi đăng ký. Sau 7 ngày, bạn gia hạn đúng gói Solo · Store · Chain đã
          chọn lúc đăng ký.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-stone-100 bg-stone-50/50 p-5 text-center md:text-left"
          >
            <div
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-black text-white shadow-md md:mx-0 ${s.colors}`}
            >
              {s.n}
            </div>
            <h3 className="mt-4 font-bold text-stone-900">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{s.desc}</p>
          </div>
        ))}
      </div>

      {showBillingNote && (
        <div className="mt-6 rounded-2xl border border-amber-100 bg-amber-50/80 px-5 py-4 text-sm text-amber-950">
          <p className="font-semibold">Thanh toán ở đâu?</p>
          <p className="mt-1 leading-relaxed text-amber-900/90">
            Sau khi đăng nhập với tài khoản <strong>chủ quán</strong>, vào{' '}
            <Link href="/dashboard/admin/billing" className={`font-semibold underline ${BRAND.primaryText}`}>
              Thanh toán & hóa đơn
            </Link>{' '}
            Chuyển khoản hoặc quét QR — sau đó chủ quán xác nhận tại{' '}
            <Link href="/dashboard/admin/billing" className={`font-semibold underline ${BRAND.primaryText}`}>
              Thanh toán & hóa đơn
            </Link>
            .
          </p>
          <p className="mt-2 text-xs text-amber-800/80">
            Đặt ảnh QR ngân hàng vào <code>FE/public/billing/qr-bank.jpg</code> và cấu hình{' '}
            <code>SAAS_BANK_*</code> trong BE/.env.
          </p>
        </div>
      )}
    </div>
  );
}
