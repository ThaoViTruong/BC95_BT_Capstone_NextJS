import Image from "next/image";
import { CalendarCheck2, ShieldCheck, Users } from "lucide-react";

export function HomeHero() {
  return (
    <section className="relative mx-auto mt-4 w-full max-w-7xl overflow-hidden rounded-[32px] border border-line/70 shadow-lg">
      <div className="absolute inset-0">
        <Image
          src="/images/banner.png"
          alt="Banner giới thiệu Stayora"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-[#061754]/55 via-[#061754]/18 to-white/0" />
      <div className="absolute inset-y-0 left-0 w-full max-w-[32rem] bg-gradient-to-r from-white/14 via-white/6 to-transparent" />

      <div className="relative flex min-h-[420px] flex-col justify-between px-5 py-6 sm:px-8 sm:py-8 lg:min-h-[500px] lg:px-10 lg:py-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/35 bg-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md">
            Stayora
            <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
            Kỳ nghỉ minh bạch
          </div>
        </div>

        <div className="w-full max-w-4xl">
          <div className="grid gap-3 text-white/95 sm:grid-cols-3">
            <article className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <ShieldCheck className="h-5 w-5 text-blue-200" />
              <p className="text-sm font-medium">Cam kết giá minh bạch</p>
            </article>
            <article className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <Users className="h-5 w-5 text-blue-200" />
              <p className="text-sm font-medium">Hỗ trợ khách hàng 24/7</p>
            </article>
            <article className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur">
              <CalendarCheck2 className="h-5 w-5 text-blue-200" />
              <p className="text-sm font-medium">Linh hoạt thay đổi kế hoạch</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
