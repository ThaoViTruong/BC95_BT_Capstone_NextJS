import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";

const footerLinks = [
  { label: "Trang chủ", href: "/" },
  { label: "Chuyến đi", href: "/chuyen-di" },
  { label: "Tài khoản", href: "/tai-khoan" },
] as const;

export function AppFooter() {
  return (
    <footer className="mt-12 border-t border-line/80 bg-white/92 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-28 shrink-0">
            <Image
              src="/images/logo.png"
              alt={siteConfig.shortName}
              fill
              className="object-contain object-left"
              sizes="112px"
            />
          </div>
        </Link>
        <p className="text-sm text-slate-500">
          © 2026 {siteConfig.name}. Bảo lưu mọi quyền.
        </p>
      </div>
    </footer>
  );
}
