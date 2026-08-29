import { AppHeader } from "@/components/layout/app-header";
import { RoleShell } from "@/components/layout/role-shell";
import { getRole } from "@/config/navigation";

const role = getRole("admin");

type AdminLayoutProps = {
  children: React.ReactNode;
};

export default function AdminLayout({ children }: AdminLayoutProps) {
  if (!role) {
    return children;
  }

  return (
    <div className="min-h-screen bg-[#0B246D] [&_.bg-card]:bg-slate-50 [&_.bg-white]:bg-slate-50">
      <AppHeader />

      <div className="mx-auto flex max-w-[1900px] items-start justify-center gap-4 px-4 py-5 sm:gap-5 sm:px-5 sm:py-7">

        <aside className="sticky top-6 hidden w-[160px] shrink-0 2xl:block">
          <div className="relative h-[650px] overflow-hidden rounded-3xl shadow-xl">
            <img
              src="/images/admin-banner-left.jpg"
              alt="Stayora"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#0B246D]/70" />

            <div className="absolute bottom-6 left-4 right-4 text-white">
              <p className="text-xs font-semibold uppercase tracking-widest">
                Stayora
              </p>

              <p className="mt-2 text-lg font-bold leading-snug">
                Khám phá nơi bạn sẽ yêu thích
              </p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <RoleShell
            title={role.title}
            desc={role.desc}
            items={role.items}
          >
            {children}
          </RoleShell>
        </div>

        <aside className="sticky top-6 hidden w-[160px] shrink-0 2xl:block">
          <div className="relative h-[650px] overflow-hidden rounded-3xl shadow-xl">
            <img
              src="/images/admin-banner-right.jpg"
              alt="Stayora Resort"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0B246D]/70" />

            <div className="absolute bottom-6 left-4 right-4 text-white">
              <p className="text-lg font-bold">
                Kỳ nghỉ trong mơ
              </p>

              <p className="mt-1 text-xs text-white/80">
                Bắt đầu cùng Stayora
              </p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
