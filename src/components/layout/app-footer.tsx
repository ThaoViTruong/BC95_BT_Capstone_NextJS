import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";

export function AppFooter() {
  return (
    <footer className="mt-12 border-t border-line/80 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-4 sm:gap-3 sm:px-6 sm:py-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="relative h-7 w-16 shrink-0 sm:h-10 sm:w-28">
            <Image
              src="/images/logo.png"
              alt={siteConfig.shortName}
              fill
              className="object-contain object-left"
              sizes="(max-width: 640px) 64px, 112px"
            />
          </div>
        </Link>
        <p className="min-w-0 flex-1 text-center text-[11px] leading-5 text-slate-500 sm:text-sm">
          © 2026 {siteConfig.name}. Bảo lưu mọi quyền.
        </p>
      </div>
    </footer>
  );
}
