export function HomeHero() {
  return (
    <section className="rounded-[32px] border border-line bg-slate-950 px-6 py-8 text-white shadow-lg sm:px-8 sm:py-10">
      <div className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-300">
          Setup khởi đầu
        </p>
        <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
          Repo đã sẵn khung cho dịch vụ đặt phòng theo đúng từng vai trò người dùng.
        </h1>
        <p className="text-base leading-7 text-slate-200 sm:text-lg">
          Kiến trúc tách theo route group và feature giúp dễ mở rộng, dễ chia việc
          và tránh lẫn UI giữa khu khách, khu chủ cho thuê và khu quản trị.
        </p>
      </div>
    </section>
  );
}
