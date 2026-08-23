import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarCheck2, ShieldCheck, Users } from "lucide-react";

import { RoomSearchForm } from "@/components/shared/room-search-form";

type HomeHeroProps = {
  destination: string;
  keyword: string;
  guest: string;
  locationOptions: string[];
};

export function HomeHero({ destination, keyword, guest, locationOptions }: HomeHeroProps) {
  return (
    <section className="relative mx-auto mt-4 w-full max-w-7xl overflow-hidden rounded-[32px] border border-line/70 shadow-lg">
      <div className="absolute inset-0">
        <Image
          src="https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=luxury%20modern%20coastal%20villa%20with%20infinity%20pool%2C%20sunset%20golden%20hour%2C%20cinematic%20real%20estate%20photography%2C%20wide%20angle%2C%20ultra%20detailed%2C%20natural%20light&image_size=landscape_16_9"
          alt="Không gian nghỉ dưỡng Stayora"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#061754]/85 via-[#061754]/60 to-[#061754]/20" />

      <div className="relative px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
        <div className="max-w-2xl space-y-4 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">
            Tìm điểm dừng chân lý tưởng
          </p>
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            Khám phá nơi bạn
            <span className="block text-blue-200">muốn ở lại thật lâu</span>
          </h1>
          <p className="max-w-xl text-base leading-7 text-slate-100 sm:text-lg">
            Chọn phòng theo nhu cầu thực tế, xem giá rõ ràng và xem đầy đủ thông
            tin trước khi đặt.
          </p>
          <Link
            href="/phong"
            className="inline-flex items-center gap-2 rounded-full bg-[#1b47d9] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#163cb7]"
          >
            Khám phá danh sách phòng
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 max-w-4xl rounded-3xl border border-white/20 bg-white/95 p-3 shadow-xl backdrop-blur">
          <RoomSearchForm
            action="/phong"
            destination={destination}
            keyword={keyword}
            guest={guest}
            locationOptions={locationOptions}
            submitClassName="h-full"
          />
        </div>

        <div className="mt-6 grid gap-3 text-white/95 sm:grid-cols-3">
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
    </section>
  );
}
