import { ReactNode } from "react";
import Image from "next/image";

function AuthMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded bg-white shadow-sm">
        <Image src="/Layer_1.svg" alt="" width={25} height={31} className="h-7 w-[23px]" priority />
      </span>
      <span className="text-lg font-bold text-white">BobaPos</span>
    </div>
  );
}

export function AuthLayout({ children, title }: { children: ReactNode; title: string }) {
  return (
    <main className="min-h-screen bg-[#f5f7fc] px-4 py-8 text-[#111d2f] sm:px-6 lg:px-10">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-[1280px] overflow-hidden rounded-lg bg-white shadow-[0_26px_70px_rgba(28,52,93,0.10)] lg:grid-cols-[1fr_1fr]">
        <div className="flex min-h-[420px] flex-col justify-between bg-primary px-8 py-10 text-white sm:px-12 lg:min-h-[720px] lg:px-14 lg:py-14">
          <div className="space-y-16 lg:space-y-24">
            <AuthMark />
            <h1 className="max-w-[520px] text-[34px] font-bold leading-[1.16] tracking-normal sm:text-[44px] lg:text-[46px]">
              {title}
            </h1>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-1 w-10 rounded-full bg-white" />
              <span className="h-1 w-3 rounded-full bg-white/35" />
              <span className="h-1 w-3 rounded-full bg-white/35" />
            </div>
            <p className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-white/90 sm:text-base">
              <span>© 2026 BobaPos Inc.</span>
              <span className="hidden text-white/45 sm:inline">•</span>
              <span>v4.2.0-stable</span>
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center px-7 py-12 sm:px-12 lg:px-20">{children}</div>
      </section>
    </main>
  );
}
