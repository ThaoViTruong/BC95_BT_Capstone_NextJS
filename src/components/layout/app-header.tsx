import Image from "next/image";
import Link from "next/link";

import { AuthAccountMenu } from "@/components/layout/auth-account-menu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-28 shrink-0 sm:h-14 sm:w-32">
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

        <AuthAccountMenu />
      </div>
    </header>
  );
}
