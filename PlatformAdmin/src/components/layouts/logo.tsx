import { env } from "@/config/env";
import Image from "next/image";

export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-[50px] w-[50px] items-center justify-center rounded-[5px] bg-white shadow-sm">
        <Image
          src="/Layer_1.svg"
          alt=""
          aria-hidden="true"
          width={25}
          height={31}
          className="h-[31px] w-[25px] flex-none"
          priority
        />
      </div>
      <span className="text-xl font-bold text-primary">{env.appName}</span>
    </div>
  );
}
