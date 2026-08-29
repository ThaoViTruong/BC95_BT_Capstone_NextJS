import Image from "next/image";
import Link from "next/link";

import { AdminSidebarToggleButton } from "@/components/layout/admin-sidebar-toggle-button";
import { AuthAccountMenu } from "@/components/layout/auth-account-menu";

type AppHeaderProps = {
  showAdminSidebarButton?: boolean;
};

export function AppHeader({ showAdminSidebarButton = false }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-[#EEF4FF] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-2.5 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
        {showAdminSidebarButton ? (
          <AdminSidebarToggleButton className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[#d7e2ff] bg-white text-[#0B246D] shadow-sm transition hover:bg-[#EEF4FF] xl:hidden" />
        ) : null}

        <Link
          href="/"
          className={showAdminSidebarButton ? "hidden min-w-0 items-center gap-2 xl:flex" : "flex min-w-0 items-center gap-2"}
        >
          <div className="relative h-9 w-20 shrink-0 sm:h-14 sm:w-32">
            <Image
              src="/images/logo.png"
              alt="Stayora"
              fill
              className="object-contain object-left"
              sizes="(max-width: 640px) 80px, 128px"
              priority
            />
          </div>
        </Link>

        <div className="ml-auto flex min-w-0 max-w-full justify-end">
          <AuthAccountMenu />
        </div>
      </div>
    </header>
  );
}
