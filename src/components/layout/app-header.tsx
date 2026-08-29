import Image from "next/image";
import Link from "next/link";

import { AuthAccountMenu } from "@/components/layout/auth-account-menu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-[#EEF4FF] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="relative h-11 w-24 shrink-0 sm:h-14 sm:w-32">
            <Image
              src="/images/logo.png"
              alt="Stayora"
              fill
              className="object-contain object-left"
              sizes="128px"
              priority
            />
          </div>
        </Link>

        <div className="ml-auto flex max-w-full justify-end">
          <AuthAccountMenu />
        </div>
      </div>
    </header>
  );
}
