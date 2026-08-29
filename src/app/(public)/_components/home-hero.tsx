import Image from "next/image";
import { CalendarCheck2, ShieldCheck, Users } from "lucide-react";

export function HomeHero() {
  return (
    <section className="relative mx-auto mt-4 w-full max-w-7xl overflow-hidden rounded-[26px] border border-line/70 shadow-lg sm:rounded-[32px]">
      <div className="absolute inset-0">
        <Image
          src="/images/banner.png"
          alt="Banner giới thiệu Stayora"
          fill
          priority
          className="object-contain object-center scale-[0.86] sm:scale-100 sm:object-cover"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#061754]/55 via-[#061754]/18 to-white/0" />
      <div className="absolute inset-y-0 left-0 w-full max-w-[20rem] bg-gradient-to-r from-white/14 via-white/6 to-transparent sm:max-w-[32rem]" />

      <div className="relative flex min-h-[360px] flex-col justify-between px-4 py-4 sm:min-h-[420px] sm:px-8 sm:py-8 lg:min-h-[500px] lg:px-10 lg:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-white/15 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-md sm:gap-2 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.2em]">
            Stayora
            <span className="h-1 w-1 rounded-full bg-white/80 sm:h-1.5 sm:w-1.5" />
            Kỳ nghỉ minh bạch
          </div>
        </div>

        <div className="w-full max-w-4xl">
          <div className="grid gap-2 text-white/95 sm:grid-cols-3 sm:gap-3">
            <article className="flex items-center gap-2.5 rounded-[20px] border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
              <ShieldCheck className="h-4 w-4 shrink-0 text-blue-200 sm:h-5 sm:w-5" />
              <p className="text-xs font-medium sm:text-sm">Cam kết giá minh bạch</p>
            </article>
            <article className="flex items-center gap-2.5 rounded-[20px] border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
              <Users className="h-4 w-4 shrink-0 text-blue-200 sm:h-5 sm:w-5" />
              <p className="text-xs font-medium sm:text-sm">Hỗ trợ khách hàng 24/7</p>
            </article>
            <article className="flex items-center gap-2.5 rounded-[20px] border border-white/20 bg-white/10 px-3 py-2.5 backdrop-blur sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3">
              <CalendarCheck2 className="h-4 w-4 shrink-0 text-blue-200 sm:h-5 sm:w-5" />
              <p className="text-xs font-medium sm:text-sm">Linh hoạt thay đổi kế hoạch</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
